import Fastify, { FastifyRequest } from "fastify";
import { createHash } from "node:crypto";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { ZodError } from "zod";
import { connectionRoutes } from "./routes/connections.js";
import { eventRoutes, isWallExpired } from "./routes/events.js";
import { supabase } from "./lib/supabase.js";
import { userRoutes } from "./routes/users.js";
import { groupRoutes } from "./routes/groups.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { closeDriver } from "./lib/neo4j.js";
import { subscribe } from "./lib/liveEvents.js";
import { getEventGraph } from "./services/graph.js";

// trustProxy so req.ip is the real client (Railway's edge sets
// X-Forwarded-For) — without it every request looks like it comes from the
// proxy and the whole event shares one rate-limit bucket. Note XFF is
// client-spoofable under `true`; acceptable here (limiting is anti-spam, not
// an auth boundary — authz always comes from the verified JWT).
const app = Fastify({ logger: true, trustProxy: true });

// Mobile clients send Content-Type: application/json even on body-less
// POSTs (e.g. /checkin); Fastify's default parser rejects the empty body.
// Treat empty as {} instead of erroring.
app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
  if (body === "" || body === undefined) return done(null, {});
  try {
    done(null, JSON.parse(body as string));
  } catch (err) {
    done(err as Error, undefined);
  }
});

// Every route validates its body with schema.parse(), which throws a raw
// ZodError — without this handler Fastify's default surfaces that as a 500
// with the full validation dump in the response instead of a 400.
app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.status(400).send({
      error: "invalid_request",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  // Fastify tags client-caused errors (bad content type, oversized body,
  // malformed JSON, rate-limit 429) with a 4xx statusCode — don't launder
  // those into 500s.
  const fastifyErr = err as { statusCode?: number; code?: string };
  if (fastifyErr.statusCode && fastifyErr.statusCode < 500) {
    if (fastifyErr.statusCode === 429) {
      return reply.status(429).send({
        error: "rate_limited",
        message: "Too many requests — give it a moment and try again.",
      });
    }
    return reply.status(fastifyErr.statusCode).send({ error: fastifyErr.code ?? "bad_request" });
  }
  app.log.error(err);
  return reply.status(500).send({ error: "internal_error" });
});

// CORS is a browser-enforced boundary, so we only need to allow the web
// origins that make cross-site fetches. The native app uses fetch with no
// Origin header (allowed below); requests from unknown browser origins get
// no CORS headers and are blocked client-side. (Bearer-token auth, no
// cookies, so this isn't a CSRF control — just tidy origin hygiene.)
const ALLOWED_ORIGINS = new Set([
  "https://getwaft.app",
  "https://waft-web.vercel.app",
  "http://localhost:3000",
]);
const VERCEL_PREVIEW = /^https:\/\/waft-web-[a-z0-9-]+\.vercel\.app$/;
await app.register(cors, {
  origin(origin, cb) {
    // No Origin: native mobile app, curl, server-to-server — allow.
    if (!origin || ALLOWED_ORIGINS.has(origin) || VERCEL_PREVIEW.test(origin)) {
      return cb(null, true);
    }
    cb(null, false);
  },
});

// Rate limit as a spam/runaway-loop backstop. Key on the bearer token when
// present, IP otherwise: a whole event NATs to one public IP on venue WiFi,
// so per-IP keying would collapse every attendee into a single bucket at peak
// (the review's sharpest scale finding). The token is a per-user/session
// value, so each attendee gets their own bucket; anonymous routes (/feedback,
// /cards) still key on IP. This is a bucket key, not authz — a forged token
// just buys its own limit, no worse than spoofing X-Forwarded-For.
// /health is exempt so Railway's frequent healthcheck never trips it.
// No errorResponseBuilder: it would replace the thrown error with its return
// value and strip the 429 statusCode, so the shared setErrorHandler below
// (which keys off statusCode) would mislabel it a 500. Let the plugin throw
// its native 429 error and shape the body there instead.
await app.register(rateLimit, {
  max: 200,
  timeWindow: "1 minute",
  allowList: (req: FastifyRequest) => req.url === "/health",
  keyGenerator: (req: FastifyRequest) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      return "u:" + createHash("sha256").update(auth.slice(7)).digest("base64url").slice(0, 22);
    }
    return "ip:" + req.ip;
  },
});

await app.register(websocket);

await app.register(connectionRoutes);
await app.register(eventRoutes);
await app.register(userRoutes);
await app.register(groupRoutes);
await app.register(feedbackRoutes);

// WebSocket for live event graph updates. Sends the current graph on
// connect, then pushes fresh snapshots whenever a connection or check-in
// happens within this event (see routes/connections.ts, routes/events.ts).
app.get("/events/:eventId/live", { websocket: true }, async (socket, req) => {
  const { eventId } = req.params as { eventId: string };
  const { data: event } = await supabase
    .from("events")
    .select("ends_at, starts_at")
    .eq("id", eventId)
    .single();
  if (event && isWallExpired(event.ends_at, event.starts_at)) {
    socket.send(JSON.stringify({ type: "expired", eventId }));
    socket.close();
    return;
  }
  subscribe(eventId, socket);
  const graph = await getEventGraph(eventId);
  socket.send(JSON.stringify({ type: "graph", eventId, ...graph }));
});

app.get("/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT) || 3001;

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Waft API running on port ${port}`);
} catch (err) {
  app.log.error(err);
  await closeDriver();
  process.exit(1);
}

process.on("SIGTERM", async () => {
  await closeDriver();
  await app.close();
});

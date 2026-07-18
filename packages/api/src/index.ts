import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { ZodError } from "zod";
import { connectionRoutes } from "./routes/connections.js";
import { eventRoutes } from "./routes/events.js";
import { userRoutes } from "./routes/users.js";
import { groupRoutes } from "./routes/groups.js";
import { closeDriver } from "./lib/neo4j.js";
import { subscribe } from "./lib/liveEvents.js";
import { getEventGraph } from "./services/graph.js";

const app = Fastify({ logger: true });

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
  // malformed JSON) with a 4xx statusCode — don't launder those into 500s.
  const fastifyErr = err as { statusCode?: number; code?: string };
  if (fastifyErr.statusCode && fastifyErr.statusCode < 500) {
    return reply.status(fastifyErr.statusCode).send({ error: fastifyErr.code ?? "bad_request" });
  }
  app.log.error(err);
  return reply.status(500).send({ error: "internal_error" });
});

await app.register(cors, { origin: true });
await app.register(websocket);

await app.register(connectionRoutes);
await app.register(eventRoutes);
await app.register(userRoutes);
await app.register(groupRoutes);

// WebSocket for live event graph updates. Sends the current graph on
// connect, then pushes fresh snapshots whenever a connection or check-in
// happens within this event (see routes/connections.ts, routes/events.ts).
app.get("/events/:eventId/live", { websocket: true }, async (socket, req) => {
  const { eventId } = req.params as { eventId: string };
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

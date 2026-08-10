import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createConnection,
  createPersonNode,
  setPersonAvatar,
  getEventGraph,
  getNetworkGraph,
  hasAttendedEvent,
  invalidateEventGraph,
} from "../services/graph.js";
import { pickIcebreaker } from "../services/icebreakers.js";
import { supabase } from "../lib/supabase.js";
import { broadcast } from "../lib/liveEvents.js";
import { requireAuth } from "../lib/auth.js";

const connectSchema = z.object({
  toUserId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
});

// Backfill a graph node from its Postgres row. Registration writes the row
// first and the node best-effort (so a paused graph store can't block login),
// which means a node can be briefly absent. We MERGE it back from the source
// of truth before creating an edge. Returns false only when no Postgres row
// exists — a genuinely unknown user, which stays a 404.
async function ensurePersonNode(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("name, photo_url, avatar")
    .eq("id", userId)
    .single();
  if (!data) return false;
  await createPersonNode(userId, data.name, data.photo_url ?? undefined);
  if (data.avatar?.color && data.avatar?.shape) {
    await setPersonAvatar(userId, data.avatar.color, data.avatar.shape);
  }
  return true;
}

const pendingSchema = z.object({
  cardCode: z.string().min(1).max(64),
  email: z.string().email().max(200),
});

export async function connectionRoutes(app: FastifyInstance) {
  // Public, unauthenticated: a not-yet-registered person viewing someone's
  // web card can ask to be connected the moment they join, so they don't have
  // to re-scan the QR after installing. We store the intent keyed on their
  // email; POST /users fulfills it when they sign up — which proves they
  // control that address. We deliberately do NOT connect an already-existing
  // account here: without proof of email control that would let anyone force
  // a connection to an arbitrary user (and leak their mutual-only socials).
  // Rate-limited like the other open write paths.
  app.post(
    "/connections/pending",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = pendingSchema.parse(req.body);
      const { data: owner } = await supabase
        .from("users")
        .select("id")
        .eq("card_code", body.cardCode)
        .single();
      if (!owner) return reply.status(404).send({ error: "card_not_found" });

      await supabase.from("pending_connections").upsert(
        { from_user_id: owner.id, invitee_email: body.email.trim().toLowerCase() },
        { onConflict: "from_user_id,invitee_email" }
      );
      return reply.send({ status: "pending" });
    }
  );

  // The connecting user is always the authenticated caller — accepting a
  // fromUserId in the body would let anyone forge edges for other people.
  app.post("/connections", { preHandler: requireAuth }, async (req, reply) => {
    const body = connectSchema.parse(req.body);
    if (body.toUserId === req.userId) {
      return reply.status(400).send({ error: "cannot_connect_to_self" });
    }

    // An eventId tags the edge onto that event's public graph. Two gates:
    //  1. The caller must have checked in — otherwise anyone could inject
    //     edges into an arbitrary event's wall. This is a hard 403.
    //  2. Both people must have checked in for it to count as an *event*
    //     connection. If the scanned person hasn't, the scan still happened
    //     and they should become mutuals — we just drop the event tag so it
    //     lands as a plain "in the wild" connection, not on the wall.
    let eventId = body.eventId;
    if (eventId) {
      if (!(await hasAttendedEvent(req.userId, eventId))) {
        return reply.status(403).send({ error: "not_checked_in" });
      }
      if (!(await hasAttendedEvent(body.toUserId, eventId))) {
        eventId = undefined;
      }
    }

    let result = await createConnection(req.userId, body.toUserId, eventId);
    if (result === null) {
      // A node may be missing if either user registered while the graph store
      // was paused (row written, node deferred). Backfill both from Postgres
      // and retry once before treating this as a real "user not found".
      const [callerOk, targetOk] = await Promise.all([
        ensurePersonNode(req.userId),
        ensurePersonNode(body.toUserId),
      ]);
      if (callerOk && targetOk) {
        result = await createConnection(req.userId, body.toUserId, eventId);
      }
    }
    if (result === null) {
      return reply.status(404).send({ error: "One or both users not found" });
    }

    // Connecting at an event: broadcast the fresh graph to live viewers and
    // hand back one of the event's icebreakers for the post-scan screen.
    let icebreaker: string | null = null;
    if (eventId) {
      // Fresh snapshot must include the edge just created — bust the cache.
      invalidateEventGraph(eventId);
      const graph = await getEventGraph(eventId);
      broadcast(eventId, { type: "graph", eventId, ...graph });
      const { data: event } = await supabase
        .from("events")
        .select("icebreakers")
        .eq("id", eventId)
        .single();
      icebreaker = pickIcebreaker(event?.icebreakers);
    }

    return reply.status(201).send({
      status: result.already ? "already_connected" : "connected",
      strength: result.strength,
      ...(icebreaker ? { icebreaker } : {}),
    });
  });

  // Your network graph is yours alone — it reveals who you know and how.
  app.get("/connections/me/graph", { preHandler: requireAuth }, async (req, reply) => {
    // Clamp to [1,4]: a negative/zero depth interpolates into the Cypher
    // range `[:WAFT*1..N]` and 500s; >4 is a runaway traversal.
    const depth = Number((req.query as any).depth) || 2;
    const graph = await getNetworkGraph(req.userId, Math.max(1, Math.min(depth, 4)));

    // Resolve event names so edge details can say where a waft happened. An
    // edge can belong to multiple events now (eventIds), so resolve them all:
    // eventNames[] carries every one; eventName stays the first, for the frozen
    // mobile binary that reads a single name.
    const allIds = [...new Set(graph.edges.flatMap((e) => e.eventIds))];
    if (allIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("id, name")
        .in("id", allIds);
      const names = new Map((events ?? []).map((e) => [e.id, e.name]));
      for (const edge of graph.edges as (typeof graph.edges[number] & {
        eventName?: string;
        eventNames?: string[];
      })[]) {
        edge.eventNames = edge.eventIds.map((id) => names.get(id)).filter(Boolean) as string[];
        edge.eventName = edge.eventNames[0];
      }
    }
    return reply.send(graph);
  });
}

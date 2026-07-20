import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createConnection, getEventGraph, getNetworkGraph } from "../services/graph.js";
import { pickIcebreaker } from "../services/icebreakers.js";
import { supabase } from "../lib/supabase.js";
import { broadcast } from "../lib/liveEvents.js";
import { requireAuth } from "../lib/auth.js";

const connectSchema = z.object({
  toUserId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
});

export async function connectionRoutes(app: FastifyInstance) {
  // The connecting user is always the authenticated caller — accepting a
  // fromUserId in the body would let anyone forge edges for other people.
  app.post("/connections", { preHandler: requireAuth }, async (req, reply) => {
    const body = connectSchema.parse(req.body);
    if (body.toUserId === req.userId) {
      return reply.status(400).send({ error: "cannot_connect_to_self" });
    }

    const result = await createConnection(req.userId, body.toUserId, body.eventId);
    if (result === null) {
      return reply.status(404).send({ error: "One or both users not found" });
    }

    // Connecting at an event: broadcast the fresh graph to live viewers and
    // hand back one of the event's icebreakers for the post-scan screen.
    let icebreaker: string | null = null;
    if (body.eventId) {
      const graph = await getEventGraph(body.eventId);
      broadcast(body.eventId, { type: "graph", eventId: body.eventId, ...graph });
      const { data: event } = await supabase
        .from("events")
        .select("icebreakers")
        .eq("id", body.eventId)
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
    const depth = Number((req.query as any).depth) || 2;
    const graph = await getNetworkGraph(req.userId, Math.min(depth, 4));

    // Resolve event names so edge details can say where a waft happened.
    const eventIds = [...new Set(graph.edges.map((e) => e.eventId).filter(Boolean))];
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("id, name")
        .in("id", eventIds);
      const names = new Map((events ?? []).map((e) => [e.id, e.name]));
      for (const edge of graph.edges as (typeof graph.edges[number] & { eventName?: string })[]) {
        if (edge.eventId) edge.eventName = names.get(edge.eventId);
      }
    }
    return reply.send(graph);
  });
}

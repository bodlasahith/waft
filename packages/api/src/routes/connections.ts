import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createConnection, getEventGraph, getNetworkGraph } from "../services/graph.js";
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

    const strength = await createConnection(req.userId, body.toUserId, body.eventId);
    if (strength === null) {
      return reply.status(404).send({ error: "One or both users not found" });
    }

    if (body.eventId) {
      const graph = await getEventGraph(body.eventId);
      broadcast(body.eventId, { type: "graph", eventId: body.eventId, ...graph });
    }

    // strength 1 = this scan created the edge; >1 = they were already
    // connected and this waft reinforced it. Clients word the two differently.
    return reply
      .status(201)
      .send({ status: strength > 1 ? "already_connected" : "connected", strength });
  });

  // Your network graph is yours alone — it reveals who you know and how.
  app.get("/connections/me/graph", { preHandler: requireAuth }, async (req, reply) => {
    const depth = Number((req.query as any).depth) || 2;
    const graph = await getNetworkGraph(req.userId, Math.min(depth, 4));
    return reply.send(graph);
  });
}

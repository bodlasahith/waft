import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createConnection, getNetworkGraph } from "../services/graph.js";

const connectSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
});

export async function connectionRoutes(app: FastifyInstance) {
  app.post("/connections", async (req, reply) => {
    const body = connectSchema.parse(req.body);
    await createConnection(body.fromUserId, body.toUserId, body.eventId);
    return reply.status(201).send({ status: "connected" });
  });

  app.get("/connections/:userId/graph", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const depth = Number((req.query as any).depth) || 2;
    const graph = await getNetworkGraph(userId, Math.min(depth, 4));
    return reply.send(graph);
  });
}

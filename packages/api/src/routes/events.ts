import { FastifyInstance } from "fastify";
import { z } from "zod";
import { checkinToEvent, getEventGraph } from "../services/graph.js";
import { supabase } from "../lib/supabase.js";
import { nanoid } from "nanoid";

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  createdBy: z.string().uuid(),
});

const checkinSchema = z.object({
  userId: z.string().uuid(),
});

export async function eventRoutes(app: FastifyInstance) {
  app.post("/events", async (req, reply) => {
    const body = createEventSchema.parse(req.body);
    const code = nanoid(8);

    const { data, error } = await supabase
      .from("events")
      .insert({
        name: body.name,
        code,
        location: body.location,
        starts_at: body.startsAt,
        ends_at: body.endsAt,
        created_by: body.createdBy,
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  app.post("/events/:eventId/checkin", async (req, reply) => {
    const { eventId } = req.params as { eventId: string };
    const body = checkinSchema.parse(req.body);
    await checkinToEvent(body.userId, eventId);
    return reply.status(200).send({ status: "checked_in" });
  });

  app.get("/events/:eventId/graph", async (req, reply) => {
    const { eventId } = req.params as { eventId: string };
    const graph = await getEventGraph(eventId);
    return reply.send(graph);
  });
}

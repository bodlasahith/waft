import { FastifyInstance } from "fastify";
import { z } from "zod";
import { checkinToEvent, getEventGraph } from "../services/graph.js";
import { generateIcebreakers } from "../services/icebreakers.js";
import { supabase } from "../lib/supabase.js";
import { broadcast } from "../lib/liveEvents.js";
import { requireAuth } from "../lib/auth.js";
import { nanoid } from "nanoid";

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  // Host-authored icebreakers; omitted → AI-generated from the event context.
  icebreakers: z.array(z.string().min(1).max(200)).max(20).optional(),
});

export async function eventRoutes(app: FastifyInstance) {
  // The organizer is the authenticated caller, not a body field.
  app.post("/events", { preHandler: requireAuth }, async (req, reply) => {
    const body = createEventSchema.parse(req.body);
    const code = nanoid(8);

    const icebreakers =
      body.icebreakers && body.icebreakers.length > 0
        ? body.icebreakers
        : await generateIcebreakers(body.name, body.location);

    const { data, error } = await supabase
      .from("events")
      .insert({
        name: body.name,
        code,
        location: body.location,
        starts_at: body.startsAt,
        ends_at: body.endsAt,
        created_by: req.userId,
        icebreakers,
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // Events the caller hosts — newest first, for the in-app host flow.
  app.get("/events/mine", { preHandler: requireAuth }, async (req, reply) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", req.userId)
      .order("created_at", { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data ?? []);
  });

  // Event QR codes encode the shareable `code`, not the internal id — the
  // client resolves it here before checking in or opening the live graph.
  app.get("/events/by-code/:code", async (req, reply) => {
    const { code } = req.params as { code: string };
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("code", code)
      .single();

    if (error) return reply.status(404).send({ error: "Event not found" });
    return reply.send(data);
  });

  // Only the host can end an event; ended events stop accepting check-ins
  // but their graph and wall stay viewable.
  app.post("/events/:eventId/end", { preHandler: requireAuth }, async (req, reply) => {
    const { eventId } = req.params as { eventId: string };
    const { data, error } = await supabase
      .from("events")
      .update({ ends_at: new Date().toISOString() })
      .eq("id", eventId)
      .eq("created_by", req.userId)
      .select()
      .single();

    if (error || !data) return reply.status(404).send({ error: "event_not_found" });
    return reply.send(data);
  });

  // You can only check yourself in — the user comes from the token.
  app.post(
    "/events/:eventId/checkin",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { eventId } = req.params as { eventId: string };
      const { data: event } = await supabase
        .from("events")
        .select("ends_at")
        .eq("id", eventId)
        .single();
      if (!event) return reply.status(404).send({ error: "event_not_found" });
      if (event.ends_at && new Date(event.ends_at) <= new Date()) {
        return reply.status(410).send({ error: "event_ended" });
      }
      await checkinToEvent(req.userId, eventId);
      broadcast(eventId, { type: "checkin", eventId, userId: req.userId });
      // Check-ins now add nodes to the event graph — push the fresh snapshot
      // so live viewers see people appear as they arrive.
      const graph = await getEventGraph(eventId);
      broadcast(eventId, { type: "graph", eventId, ...graph });
      return reply.status(200).send({ status: "checked_in" });
    }
  );

  app.get("/events/:eventId/graph", async (req, reply) => {
    const { eventId } = req.params as { eventId: string };
    const graph = await getEventGraph(eventId);
    return reply.send(graph);
  });
}

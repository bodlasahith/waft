import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";

const feedbackSchema = z.object({
  name: z.string().max(120).optional(),
  // Trim before validating so a pasted address with stray whitespace isn't
  // rejected as malformed.
  email: z.string().trim().email().max(200).optional(),
  category: z.enum(["bug", "feature", "general", "interested"]).default("general"),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(4000),
  // Honeypot: real users leave it empty; bots fill every field. Accept any
  // string here (NOT .max(0)) — a length cap would fail validation with a
  // distinguishing 400 before the silent-drop below ever runs, tipping the
  // bot off. Let it parse, then drop non-empty submissions with a bland 200.
  website: z.string().optional(),
});

export async function feedbackRoutes(app: FastifyInstance) {
  // Public, unauthenticated — anyone who scanned a card can send a note.
  // Tighter rate limit than the global default since it's an open write
  // path: no legitimate user submits feedback several times a minute.
  app.post("/feedback", {
    config: { rateLimit: { max: 8, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid_request" });
    const { website, ...data } = parsed.data;
    if (website) return reply.status(200).send({ status: "received" }); // silently drop bots

    const { error } = await supabase.from("feedback").insert(data);
    if (error) return reply.status(500).send({ error: "could_not_save" });

    // Best-effort email notification — never fail the request on this.
    if (process.env.RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Waft <auth@getwaft.app>",
          to: "bodlasahith@gmail.com",
          subject: `[Waft ${data.category}] ${data.subject || "New message"}`,
          text: `From: ${data.name || "anonymous"} <${data.email || "no email"}>\nCategory: ${data.category}\n\n${data.body}`,
        }),
      }).catch(() => {});
    }

    return reply.status(201).send({ status: "received" });
  });
}

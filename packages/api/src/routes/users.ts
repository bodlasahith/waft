import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { createPersonNode } from "../services/graph.js";
import { requireAuth } from "../lib/auth.js";
import { nanoid } from "nanoid";
import { PLATFORMS } from "@waft/shared";

const addSocialSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z.string().min(1).max(100),
  url: z.string().url().optional(),
  visibility: z.enum(["public", "event_only", "mutual_only"]).default("public"),
});

// Shared by both card lookup routes — resolves a user's public card by
// whichever column identifies them (id or card_code).
async function sendPublicCard(
  reply: FastifyReply,
  column: "id" | "card_code",
  value: string
) {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, photo_url, card_code")
    .eq(column, value)
    .single();

  if (!user) return reply.status(404).send({ error: "Card not found" });

  const { data: socials } = await supabase
    .from("social_links")
    .select("platform, handle, url")
    .eq("user_id", user.id)
    .eq("visibility", "public");

  return reply.send({ ...user, socials: socials ?? [] });
}

export async function userRoutes(app: FastifyInstance) {
  // Full profile including non-public socials — self only. Other people's
  // profiles are only visible through the public card endpoints below.
  app.get("/users/me", { preHandler: requireAuth }, async (req, reply) => {
    const { data, error } = await supabase
      .from("users")
      .select("*, social_links(*)")
      .eq("id", req.userId)
      .single();

    if (error) return reply.status(404).send({ error: "User not found" });
    return reply.send(data);
  });

  // Public card endpoint — no auth required (for QR scan fallback)
  app.get("/users/:userId/card", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    return sendPublicCard(reply, "id", userId);
  });

  // QR codes encode the opaque card_code (not the internal user id), so it
  // can be rotated independently if it ever leaks or gets shared too widely.
  app.get("/cards/:cardCode", async (req, reply) => {
    const { cardCode } = req.params as { cardCode: string };
    return sendPublicCard(reply, "card_code", cardCode);
  });

  app.post("/users/me/socials", { preHandler: requireAuth }, async (req, reply) => {
    const body = addSocialSchema.parse(req.body);

    const { data, error } = await supabase
      .from("social_links")
      .upsert(
        {
          user_id: req.userId,
          platform: body.platform,
          handle: body.handle,
          url: body.url,
          visibility: body.visibility,
        },
        { onConflict: "user_id,platform" }
      )
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  app.delete(
    "/users/me/socials/:platform",
    { preHandler: requireAuth },
    async (req, reply) => {
      const { platform } = req.params as { platform: string };
      await supabase
        .from("social_links")
        .delete()
        .eq("user_id", req.userId)
        .eq("platform", platform);

      return reply.status(204).send();
    }
  );

  // Register (or refresh) the profile after OAuth sign-in. Identity comes
  // entirely from the verified token — id from sub, email from the email
  // claim — so callers can't register as someone else.
  app.post("/users", { preHandler: requireAuth }, async (req, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        photoUrl: z.string().url().optional(),
      })
      .parse(req.body);

    if (!req.userEmail) {
      return reply.status(400).send({ error: "token_missing_email" });
    }

    // Graph node first: if it fails, no row is written and the client's next
    // /users/me still 404s, so registration retries cleanly. (Row first would
    // strand a profile with no graph node — connections to it 404 forever.)
    await createPersonNode(req.userId, body.name, body.photoUrl);

    // Preserve card_code across re-registrations — a blind upsert would
    // regenerate it and invalidate already-shared/printed QR codes.
    const { data: existing } = await supabase
      .from("users")
      .select("card_code")
      .eq("id", req.userId)
      .single();

    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: req.userId,
        name: body.name,
        email: req.userEmail,
        photo_url: body.photoUrl,
        card_code: existing?.card_code ?? nanoid(10),
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });
}

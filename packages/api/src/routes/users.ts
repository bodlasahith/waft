import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { createPersonNode } from "../services/graph.js";
import { nanoid } from "nanoid";

const PLATFORMS = [
  "instagram",
  "linkedin",
  "github",
  "x",
  "discord",
  "spotify",
  "tiktok",
  "reddit",
  "snapchat",
  "facebook",
  // Reachability platforms — used for group creation (see routes/groups.ts),
  // not just display. "phone" backs both iMessage and WhatsApp, which have
  // no separate handle concept.
  "telegram",
  "slack",
  "phone",
] as const;

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
  app.get("/users/:userId", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const { data, error } = await supabase
      .from("users")
      .select("*, social_links(*)")
      .eq("id", userId)
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

  app.post("/users/:userId/socials", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const body = addSocialSchema.parse(req.body);

    const { data, error } = await supabase
      .from("social_links")
      .upsert(
        {
          user_id: userId,
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

  app.delete("/users/:userId/socials/:platform", async (req, reply) => {
    const { userId, platform } = req.params as { userId: string; platform: string };
    await supabase
      .from("social_links")
      .delete()
      .eq("user_id", userId)
      .eq("platform", platform);

    return reply.status(204).send();
  });

  // Register user after OAuth sign-in
  app.post("/users", async (req, reply) => {
    const body = z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1),
        email: z.string().email(),
        photoUrl: z.string().url().optional(),
      })
      .parse(req.body);

    const cardCode = nanoid(10);

    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: body.id,
        name: body.name,
        email: body.email,
        photo_url: body.photoUrl,
        card_code: cardCode,
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    await createPersonNode(body.id, body.name, body.photoUrl);
    return reply.status(201).send(data);
  });
}

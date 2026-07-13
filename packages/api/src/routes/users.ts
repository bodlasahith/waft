import { FastifyInstance } from "fastify";
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
] as const;

const addSocialSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z.string().min(1).max(100),
  url: z.string().url().optional(),
  visibility: z.enum(["public", "event_only", "mutual_only"]).default("public"),
});

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
    const { data: user } = await supabase
      .from("users")
      .select("id, name, photo_url, card_code")
      .eq("id", userId)
      .single();

    if (!user) return reply.status(404).send({ error: "User not found" });

    const { data: socials } = await supabase
      .from("social_links")
      .select("platform, handle, url")
      .eq("user_id", userId)
      .eq("visibility", "public");

    return reply.send({ ...user, socials: socials ?? [] });
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

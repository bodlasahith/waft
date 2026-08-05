import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import {
  createPersonNode,
  setPersonAvatar,
  renamePersonNode,
  areConnected,
  shareAnEvent,
  deletePersonNode,
  createConnection,
} from "../services/graph.js";
import { requireAuth, optionalAuth } from "../lib/auth.js";
import { nanoid } from "nanoid";
import { AVATAR_COLORS, AVATAR_SHAPES, PLATFORMS } from "@waft/shared";

const addSocialSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z.string().min(1).max(100),
  // .url() alone accepts javascript:/data: — restrict to web schemes so a
  // stored url can't become an executable href on the public card page.
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "url must be http(s)")
    .optional(),
  visibility: z.enum(["public", "event_only", "mutual_only"]).default("public"),
});

// Shared by both card lookup routes — resolves a user's public card by
// whichever column identifies them (id or card_code).
async function sendPublicCard(
  reply: FastifyReply,
  column: "id" | "card_code",
  value: string,
  viewerId?: string
) {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, photo_url, card_code, avatar")
    .eq(column, value)
    .single();

  if (!user) return reply.status(404).send({ error: "Card not found" });

  // Everyone sees public socials. A known viewer also sees the owner's
  // restricted socials they're entitled to: mutual_only if they share a
  // WAFT edge, event_only if they've attended a common event.
  const visibilities = ["public"];
  if (viewerId && viewerId !== user.id) {
    const [connected, sharedEvent] = await Promise.all([
      areConnected(viewerId, user.id),
      shareAnEvent(viewerId, user.id),
    ]);
    if (connected) visibilities.push("mutual_only");
    if (sharedEvent) visibilities.push("event_only");
  }

  const { data: socials } = await supabase
    .from("social_links")
    .select("platform, handle, url")
    .eq("user_id", user.id)
    .in("visibility", visibilities);

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

  // Public card. optionalAuth so an unauthenticated web scan gets only
  // public socials, while a signed-in viewer also gets what they're entitled
  // to (mutual/event socials).
  app.get("/users/:userId/card", { preHandler: optionalAuth }, async (req, reply) => {
    const { userId } = req.params as { userId: string };
    return sendPublicCard(reply, "id", userId, req.userId);
  });

  // QR codes encode the opaque card_code (not the internal user id), so it
  // can be rotated independently if it ever leaks or gets shared too widely.
  app.get("/cards/:cardCode", { preHandler: optionalAuth }, async (req, reply) => {
    const { cardCode } = req.params as { cardCode: string };
    return sendPublicCard(reply, "card_code", cardCode, req.userId);
  });

  // Node avatar — mirrored onto the Neo4j Person node so every graph
  // response carries it without a Supabase join.
  app.put("/users/me/avatar", { preHandler: requireAuth }, async (req, reply) => {
    const avatar = z
      .object({
        color: z.enum(AVATAR_COLORS),
        shape: z.enum(AVATAR_SHAPES),
      })
      .parse(req.body);

    await setPersonAvatar(req.userId, avatar.color, avatar.shape);
    const { error } = await supabase.from("users").update({ avatar }).eq("id", req.userId);
    if (error) return reply.status(500).send({ error: error.message });
    return reply.send({ avatar });
  });

  // Rename the display name. OAuth sign-ins (esp. Sign in with Apple, which
  // only returns a name on the very first authorization) can land with an
  // auto-derived name; this lets the user correct it without touching photo,
  // avatar, or card_code. Postgres is the source of truth; the graph node is
  // mirrored best-effort so a paused store never blocks the rename.
  app.put("/users/me/name", { preHandler: requireAuth }, async (req, reply) => {
    const { name } = z
      .object({ name: z.string().trim().min(1).max(100) })
      .parse(req.body);

    const { data, error } = await supabase
      .from("users")
      .update({ name })
      .eq("id", req.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    try {
      await renamePersonNode(req.userId, name);
    } catch (err) {
      req.log.warn({ err }, "rename graph mirror deferred (store unavailable)");
    }
    return reply.send(data);
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

  // Self-serve account deletion. Identity comes only from the verified token
  // (self-delete only). Every step is idempotent and ordered so a partial
  // failure can be retried: graph node first, then Postgres rows, and the
  // auth record last — while it exists the user can still sign in and retry.
  app.delete("/users/me", { preHandler: requireAuth }, async (req, reply) => {
    await deletePersonNode(req.userId);

    // events.created_by has no cascade — orphan the authorship instead of
    // deleting events other attendees still reference.
    await supabase.from("events").update({ created_by: null }).eq("created_by", req.userId);

    // social_links cascade with the users row.
    const { error } = await supabase.from("users").delete().eq("id", req.userId);
    if (error) return reply.status(500).send({ error: error.message });

    const { error: authError } = await supabase.auth.admin.deleteUser(req.userId);
    if (authError && authError.status !== 404) {
      return reply.status(500).send({ error: authError.message });
    }
    return reply.status(204).send();
  });

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

    // Postgres row first — that's all sign-in/onboarding needs (the card is
    // served entirely from Postgres). The graph node is created best-effort
    // just below, so a paused/slow graph store (Aura Free auto-pauses on
    // inactivity) can never block a user from logging in. A node that fails to
    // write here is self-healed on the first connect (see routes/connections.ts:
    // createConnection null → backfill both nodes from Postgres → retry), so
    // "row without a graph node" never becomes a permanent 404.

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

    // Mirror into the graph store. Best-effort: the row above is the source of
    // truth for login, and createPersonNode is an idempotent MERGE, so a miss
    // here is harmless and recoverable (self-healed on connect).
    try {
      await createPersonNode(req.userId, body.name, body.photoUrl);
    } catch (err) {
      req.log.warn({ err }, "graph node deferred (store unavailable at register)");
    }

    // Fulfill any invite connections queued before this account existed:
    // someone viewing this person's web card entered their email and asked to
    // connect on join. We match on the *verified* token email, so the edge
    // only forms once the invitee proves control of that address by signing
    // in with it. Best-effort — a failure here must never block onboarding.
    try {
      const email = req.userEmail.toLowerCase();
      const { data: pendings } = await supabase
        .from("pending_connections")
        .select("id, from_user_id")
        .eq("invitee_email", email);
      for (const p of pendings ?? []) {
        if (p.from_user_id !== req.userId) {
          await createConnection(p.from_user_id, req.userId);
        }
      }
      if (pendings?.length) {
        await supabase
          .from("pending_connections")
          .delete()
          .in(
            "id",
            pendings.map((p) => p.id)
          );
      }
    } catch (err) {
      req.log.error({ err }, "pending-connection fulfillment failed");
    }

    return reply.status(201).send(data);
  });
}

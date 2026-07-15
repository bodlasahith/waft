import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../lib/auth.js";
import { filterConnectedUsers } from "../services/graph.js";
import {
  createDiscordGroup,
  createTelegramGroup,
  generateIMessageLink,
  generateWhatsAppLink,
  generateSlackLink,
} from "../services/platforms/index.js";

const SUPPORTED_PLATFORMS = [
  "discord",
  "telegram",
  "imessage",
  "whatsapp",
  "slack",
] as const;

const createGroupSchema = z.object({
  userIds: z.array(z.string().uuid()).min(2).max(50),
  platform: z.enum(SUPPORTED_PLATFORMS),
  name: z.string().min(1).max(100).optional(),
  eventId: z.string().uuid().optional(),
});

const suggestPlatformSchema = z.object({
  userIds: z.array(z.string().uuid()).min(2),
});

// iMessage and WhatsApp have no separate "handle" — both are reached via
// the phone number stored under the "phone" social link.
const PLATFORM_TO_SOCIAL_FIELD: Record<(typeof SUPPORTED_PLATFORMS)[number], string> = {
  discord: "discord",
  telegram: "telegram",
  imessage: "phone",
  whatsapp: "phone",
  slack: "slack",
};

export async function groupRoutes(app: FastifyInstance) {
  // Suggest the best platform for a group based on what members have linked
  app.post("/groups/suggest-platform", { preHandler: requireAuth }, async (req, reply) => {
    const { userIds: requestedIds } = suggestPlatformSchema.parse(req.body);

    // Only people the caller has actually connected with — otherwise this
    // endpoint would let anyone enumerate handles for arbitrary user ids.
    const userIds = await filterConnectedUsers(req.userId, requestedIds);
    if (userIds.length < 2) {
      return reply.status(403).send({
        error: "not_connected",
        message: "You can only create groups with people you've connected with.",
      });
    }

    const socialFields = [...new Set(Object.values(PLATFORM_TO_SOCIAL_FIELD))];
    const { data: socials } = await supabase
      .from("social_links")
      .select("user_id, platform, handle")
      .in("user_id", userIds)
      .in("platform", socialFields);

    if (!socials || socials.length === 0) {
      return reply.send({ suggestions: [], coverage: {} });
    }

    // Count how many of the selected users have each platform. iMessage and
    // WhatsApp both draw from the same "phone" social field, so the same
    // rows count toward both.
    const platformCoverage: Record<string, { count: number; total: number; handles: string[] }> = {};
    for (const platform of SUPPORTED_PLATFORMS) {
      const socialField = PLATFORM_TO_SOCIAL_FIELD[platform];
      const usersWithPlatform = socials.filter((s) => s.platform === socialField);
      platformCoverage[platform] = {
        count: usersWithPlatform.length,
        total: userIds.length,
        handles: usersWithPlatform.map((s) => s.handle),
      };
    }

    // Rank by coverage (most members on that platform first)
    const suggestions = Object.entries(platformCoverage)
      .filter(([_, v]) => v.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([platform, data]) => ({
        platform,
        coverage: data.count / data.total,
        memberCount: data.count,
        totalMembers: data.total,
      }));

    return reply.send({ suggestions, coverage: platformCoverage });
  });

  // Create a group on the specified platform
  app.post("/groups/create", { preHandler: requireAuth }, async (req, reply) => {
    const parsed = createGroupSchema.parse(req.body);

    // Same connection gate as suggest-platform (see comment there). The
    // caller is always part of their own group.
    const connectedIds = await filterConnectedUsers(req.userId, parsed.userIds);
    if (connectedIds.length < 2) {
      return reply.status(403).send({
        error: "not_connected",
        message: "You can only create groups with people you've connected with.",
      });
    }
    const body = { ...parsed, userIds: [...new Set([...connectedIds, req.userId])] };

    // Resolve group name (from event or user-provided)
    let groupName = body.name;
    if (!groupName && body.eventId) {
      const { data: event } = await supabase
        .from("events")
        .select("name")
        .eq("id", body.eventId)
        .single();
      groupName = event?.name ? `${event.name} — Waft` : "Waft Group";
    }
    groupName = groupName ?? "Waft Group";

    // Fetch relevant social handles for the target platform
    const socialPlatform = PLATFORM_TO_SOCIAL_FIELD[body.platform];

    // For iMessage/WhatsApp we need phone numbers from user profiles
    let memberHandles: string[] = [];

    if (body.platform === "imessage" || body.platform === "whatsapp") {
      const { data: phoneSocials } = await supabase
        .from("social_links")
        .select("user_id, handle")
        .in("user_id", body.userIds)
        .eq("platform", "phone");

      memberHandles = (phoneSocials ?? []).map((s) => s.handle);
    } else {
      const { data: socials } = await supabase
        .from("social_links")
        .select("user_id, handle")
        .in("user_id", body.userIds)
        .eq("platform", socialPlatform);

      memberHandles = (socials ?? []).map((s) => s.handle);
    }

    if (memberHandles.length < 2) {
      return reply.status(400).send({
        error: "insufficient_members",
        message: `Only ${memberHandles.length} of ${body.userIds.length} members have ${body.platform} linked.`,
        linkedCount: memberHandles.length,
        totalRequested: body.userIds.length,
      });
    }

    // Dispatch to the appropriate platform handler
    switch (body.platform) {
      case "discord": {
        const result = await createDiscordGroup(groupName, memberHandles);
        return reply.status(201).send({
          platform: "discord",
          type: "automated",
          inviteUrl: result.inviteUrl,
          guildId: result.guildId,
          memberCount: memberHandles.length,
        });
      }

      case "telegram": {
        // Bots can't create groups via the API — this hands back a deep
        // link that prompts the initiating user to create the group and
        // add the bot. See services/platforms/telegram.ts for why.
        const telegramIds = memberHandles.map((h) => parseInt(h, 10));
        const result = await createTelegramGroup(groupName, telegramIds);
        return reply.send({
          platform: "telegram",
          type: "deeplink",
          deepLink: result.deepLink,
          memberCount: memberHandles.length,
          notifiedCount: result.notifiedCount,
          instructions:
            "Tap to create the group in Telegram and add the Waft bot. Members who've started the bot were notified to expect an invite.",
        });
      }

      case "imessage": {
        const result = generateIMessageLink(memberHandles, groupName);
        return reply.send({
          platform: "imessage",
          type: "deeplink",
          deepLink: result.deepLink,
          memberCount: memberHandles.length,
          instructions: "Tap to open Messages with all members pre-filled.",
        });
      }

      case "whatsapp": {
        const result = generateWhatsAppLink(memberHandles, groupName);
        return reply.send({
          platform: "whatsapp",
          type: "deeplink",
          deepLink: result.deepLink,
          memberCount: memberHandles.length,
          members: result.members,
          instructions:
            "Open WhatsApp, create a new group, and add the listed members. We've copied them to your clipboard.",
        });
      }

      case "slack": {
        const result = generateSlackLink(memberHandles);
        return reply.send({
          platform: "slack",
          type: "deeplink",
          deepLink: result.deepLink,
          memberCount: memberHandles.length,
          instructions: "Tap to open a multi-person DM in Slack.",
        });
      }
    }
  });
}

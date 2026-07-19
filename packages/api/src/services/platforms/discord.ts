interface DiscordGroupResult {
  guildId: string;
  inviteUrl: string;
  channelId: string;
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
// The hub server all Waft groups live in. Discord no longer lets (new) bots
// create guilds at all — POST /guilds returns "Bots cannot use this
// endpoint" — so the bot must be invited to one pre-made server and each
// group becomes a channel there.
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const DISCORD_API = "https://discord.com/api/v10";

async function discordFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API error ${res.status}: ${body}`);
  }
  return res.json();
}

// Discord channel names: lowercase, dashes, no spaces, max 100 chars.
function toChannelName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "waft-group";
}

export async function createDiscordGroup(
  name: string,
  memberDiscordIds: string[]
): Promise<DiscordGroupResult> {
  const channel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
    method: "POST",
    body: JSON.stringify({ name: toChannelName(name), type: 0, topic: name }),
  });

  // Channel-scoped invite (7 day expiry, unlimited uses)
  const invite = await discordFetch(`/channels/${channel.id}/invites`, {
    method: "POST",
    body: JSON.stringify({ max_age: 604800, max_uses: 0 }),
  });

  // Best-effort DM to each member (works only for numeric Discord user ids
  // of people who share a server with the bot — skip silently otherwise).
  for (const discordId of memberDiscordIds) {
    if (!/^\d+$/.test(discordId)) continue;
    try {
      const dm = await discordFetch("/users/@me/channels", {
        method: "POST",
        body: JSON.stringify({ recipient_id: discordId }),
      });
      await discordFetch(`/channels/${dm.id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: `You've been invited to **${name}** on Waft! Join here: https://discord.gg/${invite.code}`,
        }),
      });
    } catch {
      // DMs may be blocked — skip silently, invite link still works
    }
  }

  return {
    guildId: DISCORD_GUILD_ID,
    inviteUrl: `https://discord.gg/${invite.code}`,
    channelId: channel.id,
  };
}

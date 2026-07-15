interface DiscordGuildResult {
  guildId: string;
  inviteUrl: string;
  channelId: string;
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
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

export async function createDiscordGroup(
  name: string,
  memberDiscordIds: string[]
): Promise<DiscordGuildResult> {
  // NOTE: POST /guilds is restricted to bots in fewer than 10 guilds total
  // (Discord API limitation, not configurable). Fine for demo volume; will
  // need a different flow (e.g. channel-per-event in one guild) before
  // real usage.
  const guild = await discordFetch("/guilds", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  // Get the default #general channel
  const channels = await discordFetch(`/guilds/${guild.id}/channels`);
  const general = channels.find((c: any) => c.type === 0) ?? channels[0];

  // Create an invite link (7 day expiry, unlimited uses)
  const invite = await discordFetch(`/channels/${general.id}/invites`, {
    method: "POST",
    body: JSON.stringify({ max_age: 604800, max_uses: 0 }),
  });

  // Send DM invite to each member via the bot
  for (const discordId of memberDiscordIds) {
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
    guildId: guild.id,
    inviteUrl: `https://discord.gg/${invite.code}`,
    channelId: general.id,
  };
}

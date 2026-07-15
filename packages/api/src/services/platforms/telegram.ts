interface TelegramGroupLinkResult {
  deepLink: string;
  notifiedCount: number;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function telegramFetch(method: string, params: Record<string, any> = {}) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data.result;
}

/**
 * Telegram bots cannot create groups or add arbitrary members via the Bot
 * API — there is no createSupergroup/inviteToChannel method. The only
 * supported flow is a "startgroup" deep link: the initiating user taps it,
 * Telegram prompts them to create a new group (or pick an existing one) and
 * adds the bot to it. Once added, the bot receives a my_chat_member update
 * and can then rename the chat / post an invite link — that part happens in
 * a webhook handler, out of scope here.
 *
 * We pre-notify members who have already started a conversation with the
 * bot so they know to expect an invite once the group exists.
 */
export async function createTelegramGroup(
  name: string,
  memberTelegramIds: number[]
): Promise<TelegramGroupLinkResult> {
  const payload = Buffer.from(name).toString("base64url").slice(0, 64);
  const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?startgroup=${payload}`;

  let notifiedCount = 0;
  for (const telegramId of memberTelegramIds) {
    try {
      await telegramFetch("sendMessage", {
        chat_id: telegramId,
        text: `You're being added to *${name}* on Waft\\! The group is being created now — you'll get an invite shortly\\.`,
        parse_mode: "MarkdownV2",
      });
      notifiedCount++;
    } catch {
      // Bot can only message users who have started a conversation with it.
    }
  }

  return { deepLink, notifiedCount };
}

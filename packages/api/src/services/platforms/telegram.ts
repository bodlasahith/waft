interface TelegramGroupResult {
  chatId: number;
  inviteLink: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
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

export async function createTelegramGroup(
  name: string,
  memberTelegramIds: number[]
): Promise<TelegramGroupResult> {
  // Create a supergroup (supports invite links, larger member limits)
  const chat = await telegramFetch("createSupergroup", {
    title: name,
    description: `Created via Waft`,
  });

  const chatId = chat.id;

  // Generate invite link
  const inviteResult = await telegramFetch("exportChatInviteLink", {
    chat_id: chatId,
  });

  // Add members (bot must have permission, members must have interacted with bot)
  for (const telegramId of memberTelegramIds) {
    try {
      await telegramFetch("inviteToChannel", {
        chat_id: chatId,
        user_id: telegramId,
      });
    } catch {
      // User may not have started the bot — they'll use the invite link instead
    }
  }

  // Send invite link to members who couldn't be auto-added
  for (const telegramId of memberTelegramIds) {
    try {
      await telegramFetch("sendMessage", {
        chat_id: telegramId,
        text: `You've been invited to *${name}* on Waft\\! Join here: ${inviteResult}`,
        parse_mode: "MarkdownV2",
      });
    } catch {
      // Bot can only message users who have started a conversation with it
    }
  }

  return {
    chatId,
    inviteLink: inviteResult,
  };
}

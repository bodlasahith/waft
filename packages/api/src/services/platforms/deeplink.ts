interface DeepLinkResult {
  platform: string;
  deepLink: string;
  fallbackUrl?: string;
  members: { name: string; handle: string }[];
}

/**
 * Generates deep links for platforms that can't be fully automated.
 * The client opens these links to pre-fill the native app's compose view.
 */

export function generateIMessageLink(
  phoneNumbers: string[],
  groupName?: string
): DeepLinkResult {
  // sms: URI with multiple recipients (comma-separated)
  // Opens Messages app with all numbers in the "To:" field
  const cleaned = phoneNumbers.map((n) => n.replace(/[^\d+]/g, ""));
  const deepLink = `sms://open?addresses=${cleaned.join(",")}`;

  return {
    platform: "imessage",
    deepLink,
    members: cleaned.map((n) => ({ name: "", handle: n })),
  };
}

export function generateWhatsAppLink(
  phoneNumbers: string[],
  groupName?: string
): DeepLinkResult {
  // WhatsApp doesn't support creating groups via deep link,
  // but we can pre-fill a message to each person with a group invite context.
  // Best approach: use WhatsApp's "click to chat" for individual invites,
  // or generate a wa.me link for the first person with a message suggesting a group.
  //
  // For groups of 2: direct chat link
  // For groups of 3+: return instructions + individual links
  if (phoneNumbers.length === 1) {
    const number = phoneNumbers[0].replace(/[^\d]/g, "");
    return {
      platform: "whatsapp",
      deepLink: `https://wa.me/${number}`,
      members: [{ name: "", handle: number }],
    };
  }

  // For multi-person: the client will need to guide the user through
  // creating a group in WhatsApp. We provide the member list.
  const cleaned = phoneNumbers.map((n) => n.replace(/[^\d]/g, ""));
  return {
    platform: "whatsapp",
    deepLink: `https://wa.me/?text=${encodeURIComponent(`Let's create a group: ${groupName ?? "Waft Group"}`)}`,
    fallbackUrl: undefined,
    members: cleaned.map((n) => ({ name: "", handle: n })),
  };
}

export function generateSlackLink(
  slackUserIds: string[],
  workspaceUrl?: string
): DeepLinkResult {
  // Slack deep link to open a multi-party DM
  // Format: slack://channel?team=T123&id=D123 (for existing)
  // For new MPDM: slack://user?team=T123&id=U123,U456
  const userList = slackUserIds.join(",");
  const deepLink = workspaceUrl
    ? `${workspaceUrl}/app/new-message?to=${userList}`
    : `slack://open?users=${userList}`;

  return {
    platform: "slack",
    deepLink,
    members: slackUserIds.map((id) => ({ name: "", handle: id })),
  };
}

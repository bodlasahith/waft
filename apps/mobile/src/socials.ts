// Shared social-platform helpers: profile URLs, badge styling, display names.
// Used by the network graph (satellite badges) and the post-scan profile sheet.

const SOCIAL_URLS: Record<string, string> = {
  instagram: "https://instagram.com/",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
  x: "https://x.com/",
  tiktok: "https://tiktok.com/@",
  reddit: "https://reddit.com/u/",
  spotify: "https://open.spotify.com/user/",
  facebook: "https://facebook.com/",
  telegram: "https://t.me/",
};

// Badge styling per platform — brand color + glyph letter.
export const PLATFORM_BADGES: Record<string, { color: string; glyph: string; dark?: boolean }> = {
  instagram: { color: "#E1306C", glyph: "I" },
  linkedin: { color: "#0A66C2", glyph: "in" },
  github: { color: "#24292e", glyph: "G" },
  x: { color: "#000000", glyph: "𝕏" },
  discord: { color: "#5865F2", glyph: "D" },
  spotify: { color: "#1DB954", glyph: "S" },
  tiktok: { color: "#010101", glyph: "T" },
  reddit: { color: "#FF4500", glyph: "R" },
  snapchat: { color: "#FFFC00", glyph: "S", dark: true },
  facebook: { color: "#1877F2", glyph: "f" },
  telegram: { color: "#229ED9", glyph: "T" },
  slack: { color: "#4A154B", glyph: "S" },
  phone: { color: "#34c77b", glyph: "☎" },
};

export const DEFAULT_BADGE = { color: "#8a94a8", glyph: "•" };

const PLATFORM_NAMES: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  github: "GitHub",
  x: "X",
  discord: "Discord",
  spotify: "Spotify",
  tiktok: "TikTok",
  reddit: "Reddit",
  snapchat: "Snapchat",
  facebook: "Facebook",
  telegram: "Telegram",
  slack: "Slack",
  phone: "Phone",
};

export function platformName(platform: string): string {
  return PLATFORM_NAMES[platform] ?? platform;
}

/** A tappable URL for a handle, or null when the platform has no profile URL (e.g. Discord). */
export function socialHref(platform: string, handle: string, url?: string): string | null {
  if (url) return url;
  if (platform === "phone") return `tel:${handle.replace(/[^+\d]/g, "")}`;
  const prefix = SOCIAL_URLS[platform];
  return prefix ? prefix + handle : null;
}

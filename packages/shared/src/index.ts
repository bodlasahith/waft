export * from "./analytics.js";

export const PLATFORMS = [
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
  // Reachability platforms — used for group creation, not just display.
  // "phone" backs both iMessage and WhatsApp, which have no separate
  // handle concept.
  "telegram",
  "slack",
  "phone",
] as const;

export type Platform = (typeof PLATFORMS)[number];

// Node avatar v1 — enough to make your node recognizably "you" in any
// graph rendering. Colors/shapes are fixed palettes so clients can render
// without validation.
export const AVATAR_COLORS = [
  "#4a7dff",
  "#ff6b6b",
  "#ffb84a",
  "#34c77b",
  "#a06bff",
  "#ff6bd6",
  "#2bc4c4",
  "#8a94a8",
] as const;
export const AVATAR_SHAPES = ["circle", "square", "diamond", "hexagon"] as const;

export interface Avatar {
  color: (typeof AVATAR_COLORS)[number];
  shape: (typeof AVATAR_SHAPES)[number];
}

export interface UserCard {
  id: string;
  name: string;
  photoUrl?: string;
  socials: SocialLink[];
}

export interface SocialLink {
  platform: Platform;
  handle: string;
  url?: string;
  visibility: "public" | "event_only" | "mutual_only";
}

export interface GraphNode {
  id: string;
  name: string;
  photoUrl?: string;
  distance?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  eventId?: string;
}

export interface EventInfo {
  id: string;
  name: string;
  code: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
}

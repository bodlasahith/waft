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

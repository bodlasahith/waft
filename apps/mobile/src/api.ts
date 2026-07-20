import { API_URL } from "./config";
import { supabase } from "./supabase";

// Token comes from the live Supabase session — supabase-js persists it
// in AsyncStorage and refreshes it automatically.
async function getSessionToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getSessionToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      // Only claim a JSON body when there is one — servers reject the
      // content type on empty bodies (this 500'd body-less POSTs).
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export interface WaftEvent {
  id: string;
  name: string;
  code: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  icebreakers: string[] | null;
}

export interface Avatar {
  color: string;
  shape: "circle" | "square" | "diamond" | "hexagon";
}

export interface MyProfile {
  id: string;
  name: string;
  photo_url: string | null;
  card_code: string;
  avatar: Avatar | null;
  social_links: { platform: string; handle: string; visibility: string }[];
}

export interface PublicCard {
  id: string;
  name: string;
  photo_url: string | null;
  card_code: string;
  avatar: Avatar | null;
  socials: { platform: string; handle: string; url?: string }[];
}

export const api = {
  me: () => request<MyProfile>("/users/me"),
  register: (name: string, photoUrl?: string) =>
    request<MyProfile>("/users", {
      method: "POST",
      body: JSON.stringify({ name, photoUrl }),
    }),
  card: (cardCode: string) => request<PublicCard>(`/cards/${cardCode}`),
  addSocial: (platform: string, handle: string, url?: string) =>
    request<unknown>("/users/me/socials", {
      method: "POST",
      body: JSON.stringify({ platform, handle, url }),
    }),
  removeSocial: (platform: string) =>
    request<null>(`/users/me/socials/${platform}`, { method: "DELETE" }),
  connect: (toUserId: string, eventId?: string) =>
    request<{
      status: "connected" | "already_connected";
      strength: number;
      icebreaker?: string;
    }>("/connections", {
      method: "POST",
      body: JSON.stringify({ toUserId, eventId }),
    }),
  setAvatar: (avatar: Avatar) =>
    request<{ avatar: Avatar }>("/users/me/avatar", {
      method: "PUT",
      body: JSON.stringify(avatar),
    }),
  myGraph: (depth = 2) =>
    request<{
      nodes: {
        id: string;
        name: string;
        photoUrl: string | null;
        avatarColor: string | null;
        avatarShape: string | null;
        distance: number;
      }[];
      edges: {
        source: string;
        target: string;
        strength: number;
        createdAt: string | null;
        eventId: string | null;
        eventName?: string;
      }[];
    }>(`/connections/me/graph?depth=${depth}`),
  userCard: (userId: string) => request<PublicCard>(`/users/${userId}/card`),
  eventByCode: (code: string) =>
    request<{ id: string; name: string }>(`/events/by-code/${code}`),
  createEvent: (
    name: string,
    location?: string,
    icebreakers?: string[],
    startsAt?: Date,
    endsAt?: Date
  ) =>
    request<WaftEvent>("/events", {
      method: "POST",
      body: JSON.stringify({
        name,
        location: location || undefined,
        startsAt: (startsAt ?? new Date()).toISOString(),
        endsAt: endsAt ? endsAt.toISOString() : undefined,
        icebreakers: icebreakers && icebreakers.length > 0 ? icebreakers : undefined,
      }),
    }),
  myEvents: () => request<WaftEvent[]>("/events/mine"),
  attendedEvents: () => request<WaftEvent[]>("/events/attended"),
  eventConnections: (eventId: string) =>
    request<{ id: string; name: string; avatarColor?: string | null; avatarShape?: string | null }[]>(
      `/events/${eventId}/connections`
    ),
  endEvent: (eventId: string) =>
    request<WaftEvent>(`/events/${eventId}/end`, { method: "POST" }),
  eventGraph: (eventId: string) =>
    request<{
      nodes: { id: string; name: string; avatarColor?: string | null; avatarShape?: string | null }[];
      edges: { source: string; target: string; strength: number }[];
    }>(`/events/${eventId}/graph`),
  checkin: (eventId: string) =>
    request<{ status: string; icebreaker?: string }>(`/events/${eventId}/checkin`, {
      method: "POST",
    }),
};

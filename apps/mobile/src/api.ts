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
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export interface MyProfile {
  id: string;
  name: string;
  photo_url: string | null;
  card_code: string;
  social_links: { platform: string; handle: string; visibility: string }[];
}

export interface PublicCard {
  id: string;
  name: string;
  photo_url: string | null;
  card_code: string;
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
  connect: (toUserId: string, eventId?: string) =>
    request<{ status: string }>("/connections", {
      method: "POST",
      body: JSON.stringify({ toUserId, eventId }),
    }),
  myGraph: (depth = 2) =>
    request<{ id: string; name: string; photoUrl: string | null; distance: number }[]>(
      `/connections/me/graph?depth=${depth}`
    ),
  eventByCode: (code: string) =>
    request<{ id: string; name: string }>(`/events/by-code/${code}`),
  checkin: (eventId: string) =>
    request<{ status: string }>(`/events/${eventId}/checkin`, { method: "POST" }),
};

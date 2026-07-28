import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

// Shared, per-file mock state referenced by the hoisted vi.mock factories.
const H = vi.hoisted(() => {
  // Late-bound so tests can flip the caller's relationship to the card owner.
  return {
    connected: false,
    sharedEvent: false,
  };
});

const state = vi.hoisted(
  () =>
    ({
      resolver: () => ({ data: null, error: null }),
      authDeleteUser: async () => ({ error: null }),
      calls: [],
    }) as SupabaseState
);

vi.mock("../src/lib/supabase.js", async () => {
  const { createSupabaseProxy } = await import("./supabaseMock");
  return { supabase: createSupabaseProxy(state) };
});

vi.mock("../src/lib/auth.js", () => ({
  requireAuth: async (req: any) => {
    req.userId = req.headers["x-user"];
  },
  // optionalAuth: sets req.userId only when a viewer id header is present.
  optionalAuth: async (req: any) => {
    if (req.headers["x-user"]) req.userId = req.headers["x-user"];
  },
}));

vi.mock("../src/services/graph.js", () => ({
  areConnected: async () => H.connected,
  shareAnEvent: async () => H.sharedEvent,
  // Unused-but-imported names resolve to undefined harmlessly.
}));

import { userRoutes } from "../src/routes/users.js";

const OWNER_ID = "11111111-1111-1111-1111-111111111111";

// The full catalog of the owner's socials, one per visibility tier.
const ALL_SOCIALS = [
  { platform: "instagram", handle: "pub", url: null, visibility: "public" },
  { platform: "linkedin", handle: "mut", url: null, visibility: "mutual_only" },
  { platform: "x", handle: "evt", url: null, visibility: "event_only" },
];

// Resolver that emulates Postgres: the users lookup returns the owner, and the
// social_links query returns only rows whose visibility is in the `.in(...)`
// set the route computed — exactly what the DB would filter server-side.
function resolver(chain: SupabaseChain) {
  if (chain.table === "users") {
    return { data: { id: OWNER_ID, name: "Owner", photo_url: null, card_code: "abc", avatar: null } };
  }
  if (chain.table === "social_links") {
    const inOp = chain.ops.find((o) => o.method === "in");
    const allowed = (inOp?.args[1] as string[]) ?? [];
    return { data: ALL_SOCIALS.filter((s) => allowed.includes(s.visibility)) };
  }
  return { data: null };
}

let app: FastifyInstance;

beforeEach(async () => {
  state.resolver = resolver;
  state.calls = [];
  H.connected = false;
  H.sharedEvent = false;
  app = Fastify();
  await app.register(userRoutes);
  await app.ready();
});

async function fetchCard(viewer?: string) {
  const res = await app.inject({
    method: "GET",
    url: `/users/${OWNER_ID}/card`,
    headers: viewer ? { "x-user": viewer } : {},
  });
  return res.json();
}

const platforms = (body: any) => body.socials.map((s: any) => s.platform).sort();

describe("public card visibility filtering", () => {
  it("anonymous viewer sees only public socials", async () => {
    const body = await fetchCard(undefined);
    expect(platforms(body)).toEqual(["instagram"]);
    // The DB filter must have been scoped to public only.
    const social = state.calls.find((c) => c.table === "social_links")!;
    const inOp = social.ops.find((o) => o.method === "in")!;
    expect(inOp.args[1]).toEqual(["public"]);
  });

  it("mutual connection additionally sees mutual_only, never event_only", async () => {
    H.connected = true;
    H.sharedEvent = false;
    const body = await fetchCard("22222222-2222-2222-2222-222222222222");
    expect(platforms(body)).toEqual(["instagram", "linkedin"]);
  });

  it("event co-attendee additionally sees event_only, never mutual_only", async () => {
    H.connected = false;
    H.sharedEvent = true;
    const body = await fetchCard("33333333-3333-3333-3333-333333333333");
    expect(platforms(body)).toEqual(["instagram", "x"]);
  });

  it("mutual + co-attendee sees every tier", async () => {
    H.connected = true;
    H.sharedEvent = true;
    const body = await fetchCard("44444444-4444-4444-4444-444444444444");
    expect(platforms(body)).toEqual(["instagram", "linkedin", "x"]);
  });

  it("owner viewing their own card via public route is treated as anonymous (no relationship checks) — only public leaks", async () => {
    // viewerId === user.id short-circuits the entitlement checks, so even the
    // owner gets only public socials from the *public* endpoint (their full
    // set comes from /users/me instead).
    const body = await fetchCard(OWNER_ID);
    expect(platforms(body)).toEqual(["instagram"]);
  });
});

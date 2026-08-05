import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

// Pins the counterpart to the register decoupling: because a Person node can be
// briefly absent (row written first, node deferred while the store was paused),
// POST /connections backfills both nodes from Postgres and retries once before
// giving up — so a node deferred during an outage never becomes a permanent 404.

const G = vi.hoisted(() => ({
  hasAttendedEvent: vi.fn(),
  createConnection: vi.fn(),
  createPersonNode: vi.fn(async () => {}),
  setPersonAvatar: vi.fn(async () => {}),
  invalidateEventGraph: vi.fn(),
  getEventGraph: vi.fn(async () => ({ nodes: [], edges: [] })),
  getNetworkGraph: vi.fn(async () => ({ nodes: [], edges: [] })),
}));

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
vi.mock("../src/services/graph.js", () => G);
vi.mock("../src/lib/auth.js", () => ({
  requireAuth: async (req: any) => {
    req.userId = req.headers["x-user"];
  },
  optionalAuth: async () => {},
}));

import { connectionRoutes } from "../src/routes/connections.js";

const CALLER = "77777777-7777-7777-7777-777777777777";
const OTHER = "88888888-8888-8888-8888-888888888888";

// Backfill lookups (ensurePersonNode) resolve to a real profile row by default.
function resolver(chain: SupabaseChain) {
  if (chain.table === "users") {
    return { data: { name: "Someone", photo_url: null, avatar: null } };
  }
  return { data: null };
}

let app: FastifyInstance;

beforeEach(async () => {
  state.resolver = resolver;
  state.calls = [];
  G.createConnection.mockReset();
  G.createPersonNode.mockReset();
  G.createPersonNode.mockResolvedValue(undefined);
  G.setPersonAvatar.mockReset();
  app = Fastify();
  await app.register(connectionRoutes);
  await app.ready();
});

const connect = (body: object) =>
  app.inject({
    method: "POST",
    url: "/connections",
    headers: { "x-user": CALLER },
    payload: body,
  });

describe("POST /connections self-heals a deferred graph node", () => {
  it("backfills both nodes and retries once when the first edge write finds no node", async () => {
    G.createConnection
      .mockResolvedValueOnce(null) // node missing on first attempt
      .mockResolvedValueOnce({ already: false, strength: 1 }); // succeeds after backfill

    const res = await connect({ toUserId: OTHER });

    expect(res.statusCode).toBe(201);
    expect(res.json().status).toBe("connected");
    expect(G.createPersonNode).toHaveBeenCalledTimes(2); // both endpoints backfilled
    expect(G.createConnection).toHaveBeenCalledTimes(2); // retried exactly once
  });

  it("still 404s when the user genuinely has no Postgres row to backfill from", async () => {
    state.resolver = () => ({ data: null }); // no profile row exists
    G.createConnection.mockResolvedValue(null);

    const res = await connect({ toUserId: OTHER });

    expect(res.statusCode).toBe(404);
    // No point creating an edge to a user that doesn't exist anywhere.
    expect(G.createConnection).toHaveBeenCalledTimes(1);
  });
});

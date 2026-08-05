import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

// Pins the App Store 2.1(a) fix: sign-up must not depend on the graph store
// being awake. Aura Free auto-pauses on inactivity, and registration used to
// write the Person node *before* the Postgres row — so a paused store blocked
// login entirely. Now the row is written first and the node is best-effort.

const G = vi.hoisted(() => ({
  createPersonNode: vi.fn(async () => {}),
  createConnection: vi.fn(async () => ({ already: false, strength: 1 })),
  setPersonAvatar: vi.fn(),
  renamePersonNode: vi.fn(async () => {}),
  areConnected: vi.fn(),
  shareAnEvent: vi.fn(),
  deletePersonNode: vi.fn(),
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
    req.userEmail = req.headers["x-email"];
  },
  optionalAuth: async () => {},
}));

import { userRoutes } from "../src/routes/users.js";

const USER = "66666666-6666-6666-6666-666666666666";

function resolver(chain: SupabaseChain) {
  if (chain.table === "users") {
    const upsertOp = chain.ops.find((o) => o.method === "upsert");
    if (upsertOp) {
      const payload = upsertOp.args[0] as any;
      return { data: { id: USER, name: payload.name, card_code: payload.card_code }, error: null };
    }
    return { data: { card_code: "STABLECODE" }, error: null };
  }
  if (chain.table === "pending_connections") return { data: [], error: null };
  return { data: null, error: null };
}

let app: FastifyInstance;

beforeEach(async () => {
  state.resolver = resolver;
  state.calls = [];
  G.createPersonNode.mockReset();
  G.createPersonNode.mockResolvedValue(undefined);
  app = Fastify();
  await app.register(userRoutes);
  await app.ready();
});

const register = () =>
  app.inject({
    method: "POST",
    url: "/users",
    headers: { "x-user": USER, "x-email": "u@example.com" },
    payload: { name: "New User" },
  });

describe("POST /users survives a paused graph store", () => {
  it("still creates the profile (201) when the graph node write throws", async () => {
    G.createPersonNode.mockRejectedValueOnce(new Error("Neo4j is paused"));
    const res = await register();
    expect(res.statusCode).toBe(201);
    // The Postgres row is what sign-in needs — it must be written regardless.
    const wroteRow = state.calls.some(
      (c) => c.table === "users" && c.ops.some((o) => o.method === "upsert")
    );
    expect(wroteRow).toBe(true);
  });

  it("writes the Postgres row before attempting the graph node", async () => {
    const order: string[] = [];
    G.createPersonNode.mockImplementation(async () => {
      order.push("node");
    });
    state.resolver = (chain) => {
      if (chain.table === "users" && chain.ops.some((o) => o.method === "upsert")) {
        order.push("row");
      }
      return resolver(chain);
    };
    const res = await register();
    expect(res.statusCode).toBe(201);
    expect(order.indexOf("row")).toBeGreaterThanOrEqual(0);
    expect(order.indexOf("row")).toBeLessThan(order.indexOf("node"));
  });
});

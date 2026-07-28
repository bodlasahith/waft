import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

const G = vi.hoisted(() => ({
  createPersonNode: vi.fn(async () => {}),
  createConnection: vi.fn(async () => ({ already: false, strength: 1 })),
  setPersonAvatar: vi.fn(),
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

// Captures the payload the route hands to users.upsert so we can assert on the
// card_code it chose.
let upsertPayload: any = null;

function makeResolver(existingCardCode: string | null) {
  return (chain: SupabaseChain) => {
    if (chain.table === "users") {
      const upsertOp = chain.ops.find((o) => o.method === "upsert");
      if (upsertOp) {
        upsertPayload = upsertOp.args[0];
        return { data: { id: USER, card_code: (upsertPayload as any).card_code }, error: null };
      }
      // The pre-upsert card_code lookup.
      return { data: existingCardCode ? { card_code: existingCardCode } : null, error: null };
    }
    if (chain.table === "pending_connections") {
      return { data: [], error: null };
    }
    return { data: null, error: null };
  };
}

let app: FastifyInstance;

beforeEach(async () => {
  upsertPayload = null;
  state.calls = [];
  app = Fastify();
  await app.register(userRoutes);
  await app.ready();
});

const register = () =>
  app.inject({
    method: "POST",
    url: "/users",
    headers: { "x-user": USER, "x-email": "u@example.com" },
    payload: { name: "Re-registering User" },
  });

describe("card_code preservation on POST /users", () => {
  it("preserves an existing card_code across re-registration (never regenerates it)", async () => {
    state.resolver = makeResolver("STABLECODE");
    const res = await register();
    expect(res.statusCode).toBe(201);
    expect(upsertPayload.card_code).toBe("STABLECODE");
  });

  it("mints a fresh 10-char card_code only when none exists yet", async () => {
    state.resolver = makeResolver(null);
    const res = await register();
    expect(res.statusCode).toBe(201);
    expect(typeof upsertPayload.card_code).toBe("string");
    expect(upsertPayload.card_code).toHaveLength(10);
    expect(upsertPayload.card_code).not.toBe("STABLECODE");
  });

  it("identity fields come from the token, not the body", async () => {
    state.resolver = makeResolver("STABLECODE");
    await register();
    expect(upsertPayload.id).toBe(USER);
    expect(upsertPayload.email).toBe("u@example.com");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

// Database failures must not be reported as "not found": the mobile app treats
// GET /users/me → 404 as "not registered" and re-registers (overwriting a
// renamed profile), and the web card tells visitors "you're set" on a 2xx.

const G = vi.hoisted(() => ({
  createPersonNode: vi.fn(async () => {}),
  createConnection: vi.fn(async () => ({ already: false, strength: 1 })),
  setPersonAvatar: vi.fn(),
  areConnected: vi.fn(),
  shareAnEvent: vi.fn(),
  deletePersonNode: vi.fn(),
  checkIn: vi.fn(),
  getEventGraph: vi.fn(),
  getEventTimeline: vi.fn(),
  getMyEventConnections: vi.fn(),
  getAttendedEventIds: vi.fn(),
  getNetworkGraph: vi.fn(),
  backfillPerson: vi.fn(),
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
import { connectionRoutes } from "../src/routes/connections.js";
import { eventRoutes } from "../src/routes/events.js";

const USER = "77777777-7777-7777-7777-777777777777";
const DB_DOWN = { message: "connection terminated", code: "08006" };

let app: FastifyInstance;

beforeEach(async () => {
  state.calls = [];
  state.resolver = () => ({ data: null, error: null });
  app = Fastify();
  await app.register(userRoutes);
  await app.register(connectionRoutes);
  await app.register(eventRoutes);
  await app.ready();
});

const authed = { "x-user": USER, "x-email": "u@example.com" };

describe("GET /users/me", () => {
  it("returns 404 only when the row genuinely does not exist", async () => {
    state.resolver = () => ({ data: null, error: null });
    const res = await app.inject({ method: "GET", url: "/users/me", headers: authed });
    expect(res.statusCode).toBe(404);
  });

  it("returns 500 (not 404) when the database errors, so the client won't re-register", async () => {
    state.resolver = () => ({ data: null, error: DB_DOWN });
    const res = await app.inject({ method: "GET", url: "/users/me", headers: authed });
    expect(res.statusCode).toBe(500);
  });
});

describe("POST /users", () => {
  it("refuses to register when the existing-row read fails (never mints a new card_code)", async () => {
    let upserted = false;
    state.resolver = (chain: SupabaseChain) => {
      if (chain.ops.some((o) => o.method === "upsert")) {
        upserted = true;
        return { data: { id: USER }, error: null };
      }
      return { data: null, error: DB_DOWN };
    };
    const res = await app.inject({
      method: "POST",
      url: "/users",
      headers: authed,
      payload: { name: "Someone" },
    });
    expect(res.statusCode).toBe(500);
    expect(upserted).toBe(false);
  });
});

describe("POST /connections/pending", () => {
  const send = () =>
    app.inject({
      method: "POST",
      url: "/connections/pending",
      payload: { cardCode: "ABCDEFGHIJ", email: "friend@example.com" },
    });

  it("reports a failed write instead of claiming the invite is pending", async () => {
    state.resolver = (chain: SupabaseChain) =>
      chain.table === "users"
        ? { data: { id: USER }, error: null }
        : { data: null, error: DB_DOWN };
    const res = await send();
    expect(res.statusCode).toBe(500);
  });

  it("returns pending when the write succeeds", async () => {
    state.resolver = (chain: SupabaseChain) =>
      chain.table === "users" ? { data: { id: USER }, error: null } : { data: null, error: null };
    const res = await send();
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "pending" });
  });

  it("returns 404 for an unknown card", async () => {
    state.resolver = () => ({ data: null, error: null });
    const res = await send();
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /events/by-code/:code", () => {
  it("returns 404 for an unknown code", async () => {
    state.resolver = () => ({ data: null, error: null });
    const res = await app.inject({ method: "GET", url: "/events/by-code/NOPE" });
    expect(res.statusCode).toBe(404);
  });

  it("returns 500 (not 404) when the database errors", async () => {
    state.resolver = () => ({ data: null, error: DB_DOWN });
    const res = await app.inject({ method: "GET", url: "/events/by-code/NOPE" });
    expect(res.statusCode).toBe(500);
  });
});

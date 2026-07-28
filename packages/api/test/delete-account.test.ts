import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

// Cross-store call order: every mocked store appends a label here so we can
// assert the delete sequence is graph -> postgres -> auth (auth last so a
// partial failure leaves the account signed-in-able and retryable).
const order = vi.hoisted(() => ({ log: [] as string[] }));

const G = vi.hoisted(() => ({
  deletePersonNode: vi.fn(),
  // Other graph names imported by users.ts — unused here.
  createPersonNode: vi.fn(),
  setPersonAvatar: vi.fn(),
  areConnected: vi.fn(),
  shareAnEvent: vi.fn(),
  createConnection: vi.fn(),
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

const USER = "55555555-5555-5555-5555-555555555555";

function resolver(chain: SupabaseChain) {
  const isDelete = chain.ops.some((o) => o.method === "delete");
  const isUpdate = chain.ops.some((o) => o.method === "update");
  if (chain.table === "events" && isUpdate) order.log.push("pg-events-orphan");
  if (chain.table === "users" && isDelete) order.log.push("pg-user-delete");
  return { data: null, error: null };
}

let app: FastifyInstance;

beforeEach(async () => {
  order.log = [];
  state.resolver = resolver;
  state.calls = [];
  state.authDeleteUser = async () => {
    order.log.push("auth-delete");
    return { error: null };
  };
  G.deletePersonNode.mockReset();
  G.deletePersonNode.mockImplementation(async () => {
    order.log.push("graph-delete");
  });
  app = Fastify();
  await app.register(userRoutes);
  await app.ready();
});

const del = () =>
  app.inject({ method: "DELETE", url: "/users/me", headers: { "x-user": USER } });

describe("DELETE /users/me ordering & idempotency", () => {
  it("deletes graph node first, postgres rows next, auth user last", async () => {
    const res = await del();
    expect(res.statusCode).toBe(204);
    expect(order.log).toEqual([
      "graph-delete",
      "pg-events-orphan",
      "pg-user-delete",
      "auth-delete",
    ]);
    // deletePersonNode called with the token's user id, never a body field.
    expect(G.deletePersonNode).toHaveBeenCalledWith(USER);
  });

  it("is idempotent — a second delete is a safe 204 no-op", async () => {
    const first = await del();
    const second = await del();
    expect(first.statusCode).toBe(204);
    expect(second.statusCode).toBe(204);
  });

  it("treats an auth 404 (already-gone auth user) as success, not a 500", async () => {
    state.authDeleteUser = async () => ({ error: { status: 404, message: "not found" } });
    const res = await del();
    expect(res.statusCode).toBe(204);
  });

  it("surfaces a non-404 auth failure as 500 (retryable), without having removed the auth user prematurely", async () => {
    state.authDeleteUser = async () => ({ error: { status: 500, message: "boom" } });
    const res = await del();
    expect(res.statusCode).toBe(500);
    // Graph + postgres deletes still ran before the auth step.
    expect(G.deletePersonNode).toHaveBeenCalled();
  });

  it("bails to 500 if the postgres users delete errors, before touching auth", async () => {
    state.resolver = (chain) => {
      if (chain.table === "users" && chain.ops.some((o) => o.method === "delete")) {
        return { data: null, error: { message: "db down" } };
      }
      return { data: null, error: null };
    };
    let authCalled = false;
    state.authDeleteUser = async () => {
      authCalled = true;
      return { error: null };
    };
    const res = await del();
    expect(res.statusCode).toBe(500);
    expect(authCalled).toBe(false);
  });
});

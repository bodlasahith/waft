import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

// Pins the eventId (scalar) → eventIds (set) change at the client contract
// boundary: an edge made at two events resolves BOTH names, and the legacy
// scalar fields (eventId/eventName) stay populated as the first element so the
// frozen mobile binary keeps working.

const G = vi.hoisted(() => ({
  getNetworkGraph: vi.fn(),
  createConnection: vi.fn(),
  getEventGraph: vi.fn(async () => ({ nodes: [], edges: [] })),
  invalidateEventGraph: vi.fn(),
  hasAttendedEvent: vi.fn(),
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
vi.mock("../src/services/icebreakers.js", () => ({ pickIcebreaker: () => null }));
vi.mock("../src/lib/liveEvents.js", () => ({ broadcast: () => {} }));
vi.mock("../src/lib/auth.js", () => ({
  requireAuth: async (req: any) => {
    req.userId = req.headers["x-user"];
  },
  optionalAuth: async () => {},
}));

import { connectionRoutes } from "../src/routes/connections.js";

const USER = "11111111-1111-1111-1111-111111111111";
const EVENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const EVENT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

let app: FastifyInstance;

beforeEach(async () => {
  state.calls = [];
  G.getNetworkGraph.mockReset();
  // Names come back for both events the edge belongs to.
  state.resolver = (chain: SupabaseChain) => {
    if (chain.table === "events") {
      return { data: [{ id: EVENT_A, name: "Alpha Dinner" }, { id: EVENT_B, name: "Beta Mixer" }] };
    }
    return { data: null };
  };
  app = Fastify();
  await app.register(connectionRoutes);
  await app.ready();
});

const getGraph = () =>
  app.inject({ method: "GET", url: "/connections/me/graph", headers: { "x-user": USER } });

describe("GET /connections/me/graph resolves eventIds", () => {
  it("attaches every event name and keeps eventName/eventId as the first", async () => {
    G.getNetworkGraph.mockResolvedValue({
      nodes: [],
      edges: [{ source: USER, target: "x", strength: 1, createdAt: null, eventIds: [EVENT_A, EVENT_B], eventId: EVENT_A }],
    });

    const res = await getGraph();
    expect(res.statusCode).toBe(200);
    const edge = res.json().edges[0];
    expect(edge.eventNames).toEqual(["Alpha Dinner", "Beta Mixer"]);
    expect(edge.eventName).toBe("Alpha Dinner"); // legacy scalar = first
    expect(edge.eventId).toBe(EVENT_A);
  });

  it("leaves an in-the-wild edge (no events) with an empty name list", async () => {
    G.getNetworkGraph.mockResolvedValue({
      nodes: [],
      edges: [{ source: USER, target: "y", strength: 1, createdAt: null, eventIds: [], eventId: null }],
    });

    const res = await getGraph();
    expect(res.statusCode).toBe(200);
    const edge = res.json().edges[0];
    // No events → no lookup, no names attached.
    expect(edge.eventNames ?? []).toEqual([]);
    expect(edge.eventName ?? null).toBeNull();
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import type { SupabaseChain, SupabaseState } from "./supabaseMock";

const G = vi.hoisted(() => ({
  hasAttendedEvent: vi.fn(),
  createConnection: vi.fn(async () => ({ already: false, strength: 1 })),
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
const EVENT = "99999999-9999-9999-9999-999999999999";

// Supplies the icebreaker list for the post-scan screen.
function resolver(chain: SupabaseChain) {
  if (chain.table === "events") return { data: { icebreakers: ["Hi there"] } };
  return { data: null };
}

// Program per-(user,event) attendance for hasAttendedEvent(userId, eventId).
function setAttendance(attended: Record<string, boolean>) {
  G.hasAttendedEvent.mockImplementation(async (userId: string) => !!attended[userId]);
}

let app: FastifyInstance;

beforeEach(async () => {
  state.resolver = resolver;
  state.calls = [];
  G.hasAttendedEvent.mockReset();
  G.createConnection.mockReset();
  G.createConnection.mockResolvedValue({ already: false, strength: 1 });
  G.invalidateEventGraph.mockReset();
  G.getEventGraph.mockReset();
  G.getEventGraph.mockResolvedValue({ nodes: [], edges: [] });
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

describe("POST /connections event-attendance guard", () => {
  it("rejects self-connection with 400 and never creates an edge", async () => {
    const res = await connect({ toUserId: CALLER });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("cannot_connect_to_self");
    expect(G.createConnection).not.toHaveBeenCalled();
  });

  it("scanner not checked in -> hard 403, no connection made", async () => {
    setAttendance({ [CALLER]: false, [OTHER]: true });
    const res = await connect({ toUserId: OTHER, eventId: EVENT });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe("not_checked_in");
    expect(G.createConnection).not.toHaveBeenCalled();
  });

  it("scanned party not checked in -> connection still made but event tag dropped", async () => {
    setAttendance({ [CALLER]: true, [OTHER]: false });
    const res = await connect({ toUserId: OTHER, eventId: EVENT });
    expect(res.statusCode).toBe(201);
    // eventId dropped -> createConnection called WITHOUT an event id.
    expect(G.createConnection).toHaveBeenCalledWith(CALLER, OTHER, undefined);
    // No event side-effects: not on the wall, no icebreaker returned.
    expect(G.invalidateEventGraph).not.toHaveBeenCalled();
    expect(res.json().icebreaker).toBeUndefined();
  });

  it("both checked in -> event-tagged connection with wall refresh + icebreaker", async () => {
    setAttendance({ [CALLER]: true, [OTHER]: true });
    const res = await connect({ toUserId: OTHER, eventId: EVENT });
    expect(res.statusCode).toBe(201);
    expect(G.createConnection).toHaveBeenCalledWith(CALLER, OTHER, EVENT);
    expect(G.invalidateEventGraph).toHaveBeenCalledWith(EVENT);
    expect(G.getEventGraph).toHaveBeenCalledWith(EVENT);
    expect(res.json().icebreaker).toBe("Hi there");
  });

  it("no eventId -> plain connection, attendance never consulted", async () => {
    setAttendance({});
    const res = await connect({ toUserId: OTHER });
    expect(res.statusCode).toBe(201);
    expect(G.hasAttendedEvent).not.toHaveBeenCalled();
    expect(G.createConnection).toHaveBeenCalledWith(CALLER, OTHER, undefined);
  });

  it("both checked in but users missing in graph -> createConnection null -> 404", async () => {
    setAttendance({ [CALLER]: true, [OTHER]: true });
    G.createConnection.mockResolvedValueOnce(null);
    const res = await connect({ toUserId: OTHER, eventId: EVENT });
    expect(res.statusCode).toBe(404);
  });
});

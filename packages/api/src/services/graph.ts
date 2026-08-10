import { getDriver } from "../lib/neo4j.js";

export async function createPersonNode(userId: string, name: string, photoUrl?: string) {
  const session = getDriver().session();
  try {
    await session.run(
      `MERGE (p:Person {id: $userId})
       SET p.name = $name, p.photoUrl = $photoUrl, p.updatedAt = datetime()`,
      { userId, name, photoUrl: photoUrl ?? null }
    );
  } finally {
    await session.close();
  }
}

export async function setPersonAvatar(userId: string, color: string, shape: string) {
  const session = getDriver().session();
  try {
    await session.run(
      `MATCH (p:Person {id: $userId})
       SET p.avatarColor = $color, p.avatarShape = $shape`,
      { userId, color, shape }
    );
  } finally {
    await session.close();
  }
}

/**
 * Rename the graph node. A best-effort mirror of the Postgres name — callers
 * treat a failure as non-fatal so a paused/slow graph store never blocks a
 * rename (the source of truth is Postgres).
 */
export async function renamePersonNode(userId: string, name: string) {
  const session = getDriver().session();
  try {
    await session.run(
      `MATCH (p:Person {id: $userId})
       SET p.name = $name, p.updatedAt = datetime()`,
      { userId, name }
    );
  } finally {
    await session.close();
  }
}

/**
 * Trivial round-trip to keep the (auto-pausing) graph store warm and to report
 * its liveness on the health endpoint. Throws if the store is unreachable.
 */
export async function pingGraph(): Promise<void> {
  const session = getDriver().session();
  try {
    await session.run("RETURN 1 AS ok");
  } finally {
    await session.close();
  }
}

/**
 * Returns null if either person doesn't exist yet. Rescanning an existing
 * connection is a no-op on strength — scanning is a one-time handshake;
 * strength will grow from real interactions (profile taps, explicit social
 * shares — see roadmap), not repeat scans.
 */
export async function createConnection(
  fromUserId: string,
  toUserId: string,
  eventId?: string
): Promise<{ already: boolean; strength: number } | null> {
  const session = getDriver().session();
  try {
    const result = await session.run(
      // An edge accumulates EVERY event it was scanned at (r.eventIds), not one
      // last-write-wins slot. Scanning at event B used to overwrite event A's
      // tag, silently dropping the edge from A's wall; appending keeps it on
      // both. Empty list = met "in the wild" (no event). Dedup so a rescan at
      // the same event is idempotent. (Legacy edges may still carry a scalar
      // r.eventId — reads tolerate it; we never write the scalar anymore.)
      `MATCH (a:Person {id: $fromUserId}), (b:Person {id: $toUserId})
       OPTIONAL MATCH (a)-[existing:WAFT]-(b)
       WITH a, b, existing IS NOT NULL AS already
       MERGE (a)-[r:WAFT]-(b)
       ON CREATE SET r.createdAt = datetime(), r.strength = 1, r.eventIds = []
       SET r.eventIds = CASE
             WHEN $eventId IS NULL THEN coalesce(r.eventIds, [])
             WHEN $eventId IN coalesce(r.eventIds, []) THEN r.eventIds
             ELSE coalesce(r.eventIds, []) + $eventId
           END
       RETURN already, r.strength AS strength`,
      { fromUserId, toUserId, eventId: eventId ?? null }
    );
    if (result.records.length === 0) return null;
    const record = result.records[0];
    return { already: record.get("already"), strength: record.get("strength").toNumber() };
  } finally {
    await session.close();
  }
}

export async function getNetworkGraph(userId: string, depth: number = 2) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH path = (origin:Person {id: $userId})-[:WAFT*1..${depth}]-(connected:Person)
       RETURN DISTINCT connected.id AS id, connected.name AS name, connected.photoUrl AS photoUrl,
              connected.avatarColor AS avatarColor, connected.avatarShape AS avatarShape,
              length(shortestPath((origin)-[:WAFT*]-(connected))) AS distance`,
      { userId }
    );
    const nodes = result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      photoUrl: r.get("photoUrl"),
      avatarColor: r.get("avatarColor"),
      avatarShape: r.get("avatarShape"),
      distance: r.get("distance").toNumber(),
    }));

    // Edges among the visible set (self included) — what makes it a graph
    // rather than a list. a.id < b.id dedupes the undirected pair.
    const ids = [userId, ...nodes.map((n) => n.id)];
    const edgeResult = await session.run(
      `MATCH (a:Person)-[r:WAFT]-(b:Person)
       WHERE a.id IN $ids AND b.id IN $ids AND a.id < b.id
       RETURN a.id AS source, b.id AS target, coalesce(r.strength, 1) AS strength,
              toString(r.createdAt) AS createdAt,
              coalesce(r.eventIds, CASE WHEN r.eventId IS NULL THEN [] ELSE [r.eventId] END) AS eventIds`,
      { ids }
    );
    const edges = edgeResult.records.map((r) => {
      const eventIds = (r.get("eventIds") as string[]) ?? [];
      return {
        source: r.get("source"),
        target: r.get("target"),
        strength: r.get("strength").toNumber(),
        createdAt: r.get("createdAt"),
        eventIds,
        // Kept for the frozen mobile binary (build 13), which reads a scalar
        // edge.eventId to label an edge "an event" vs "in the wild".
        eventId: eventIds[0] ?? null,
      };
    });

    return { nodes, edges };
  } finally {
    await session.close();
  }
}

type EventGraph = {
  nodes: { id: string; name: string; avatarColor?: string; avatarShape?: string }[];
  edges: { source: string; target: string; strength: number }[];
};

// Short-TTL cache for the event graph. The live wall's read volume spikes on
// reconnect storms — a venue WiFi blip reconnects every viewer at once, each
// re-fetching the graph — so serving those from a ~3s cache collapses
// hundreds of identical Neo4j round-trips into one. Writes (check-in, new
// connection) call invalidateEventGraph before they re-broadcast, so the live
// snapshot stays correct; the cache only ever absorbs read bursts.
const EVENT_GRAPH_TTL_MS = 3000;
const eventGraphCache = new Map<string, { ts: number; data: EventGraph }>();

export function invalidateEventGraph(eventId: string) {
  eventGraphCache.delete(eventId);
}

export async function getEventGraph(eventId: string): Promise<EventGraph> {
  const hit = eventGraphCache.get(eventId);
  if (hit && Date.now() - hit.ts < EVENT_GRAPH_TTL_MS) return hit.data;
  const data = await queryEventGraph(eventId);
  eventGraphCache.set(eventId, { ts: Date.now(), data });
  return data;
}

async function queryEventGraph(eventId: string): Promise<EventGraph> {
  const session = getDriver().session();
  try {
    // Attendees are nodes the moment they check in — the live graph should
    // show people arriving, not just people who've already connected there.
    const attendees = await session.run(
      `MATCH (p:Person)-[:ATTENDED]->(:Event {id: $eventId})
       RETURN p.id AS id, p.name AS name, p.avatarColor AS avatarColor, p.avatarShape AS avatarShape`,
      { eventId }
    );
    const nodes = new Map<
      string,
      { id: string; name: string; avatarColor?: string; avatarShape?: string }
    >();
    for (const r of attendees.records) {
      nodes.set(r.get("id"), {
        id: r.get("id"),
        name: r.get("name"),
        avatarColor: r.get("avatarColor") ?? undefined,
        avatarShape: r.get("avatarShape") ?? undefined,
      });
    }

    // Edges are connections MADE AT this event — the edge's eventIds contains
    // this event. Checking in only adds you as a node; you link to someone only
    // by actually meeting and scanning them here. So the wall shows the
    // networking that happened at the event, not pre-existing relationships. A
    // mutual made elsewhere stays in personal networks and appears here only if
    // the two also connect at the event. The `OR r.eventId = $eventId` clause
    // keeps legacy scalar-tagged edges visible without a migration.
    // (a.id < b.id dedupes the undirected pair.)
    const result = await session.run(
      `MATCH (a:Person)-[r:WAFT]-(b:Person)
       WHERE a.id < b.id AND ($eventId IN coalesce(r.eventIds, []) OR r.eventId = $eventId)
       RETURN a.id AS source, a.name AS sourceName,
              b.id AS target, b.name AS targetName, coalesce(r.strength, 1) AS strength`,
      { eventId }
    );
    const edges: { source: string; target: string; strength: number }[] = [];
    for (const rec of result.records) {
      const source = rec.get("source");
      const target = rec.get("target");
      // People who connected here but never scanned the event QR still belong
      // on the wall — add them as nodes off the edge.
      if (!nodes.has(source)) nodes.set(source, { id: source, name: rec.get("sourceName") });
      if (!nodes.has(target)) nodes.set(target, { id: target, name: rec.get("targetName") });
      edges.push({ source, target, strength: rec.get("strength")?.toNumber?.() ?? 1 });
    }

    return { nodes: [...nodes.values()], edges };
  } finally {
    await session.close();
  }
}

type EventTimeline = {
  nodes: {
    id: string;
    name: string;
    avatarColor?: string;
    avatarShape?: string;
    // ISO 8601 — when this person first appears on the wall (their check-in,
    // or their earliest connection here if they never scanned the event QR).
    t: string;
  }[];
  edges: { source: string; target: string; strength: number; t: string }[];
};

/**
 * Full event graph WITH timestamps, for Event Replay. Same nodes/edges as
 * getEventGraph, but each carries when it came into being (check-in time /
 * connection time) so the client can scrub the room from empty to full. This
 * is a pure read over data that already exists — check-ins stamp
 * ATTENDED.checkedInAt and connections stamp WAFT.createdAt — so replay costs
 * no extra writes. Not cached: it's fetched once per replay session, not on the
 * live wall's hot reconnect path.
 */
export async function getEventTimeline(eventId: string): Promise<EventTimeline> {
  const session = getDriver().session();
  try {
    const attendees = await session.run(
      `MATCH (p:Person)-[a:ATTENDED]->(:Event {id: $eventId})
       RETURN p.id AS id, p.name AS name, p.avatarColor AS avatarColor,
              p.avatarShape AS avatarShape, toString(a.checkedInAt) AS checkedInAt`,
      { eventId }
    );
    const nodes = new Map<string, EventTimeline["nodes"][number]>();
    for (const r of attendees.records) {
      nodes.set(r.get("id"), {
        id: r.get("id"),
        name: r.get("name"),
        avatarColor: r.get("avatarColor") ?? undefined,
        avatarShape: r.get("avatarShape") ?? undefined,
        t: r.get("checkedInAt"),
      });
    }

    const result = await session.run(
      `MATCH (a:Person)-[r:WAFT]-(b:Person)
       WHERE a.id < b.id AND ($eventId IN coalesce(r.eventIds, []) OR r.eventId = $eventId)
       RETURN a.id AS source, a.name AS sourceName,
              b.id AS target, b.name AS targetName,
              coalesce(r.strength, 1) AS strength, toString(r.createdAt) AS createdAt`,
      { eventId }
    );
    const edges: EventTimeline["edges"] = [];
    for (const rec of result.records) {
      const source = rec.get("source");
      const target = rec.get("target");
      const createdAt = rec.get("createdAt");
      // An endpoint that connected here but never checked in still belongs on
      // the wall; it first appears at its earliest connection time.
      for (const [id, nameKey] of [
        [source, "sourceName"],
        [target, "targetName"],
      ] as const) {
        const existing = nodes.get(id);
        if (!existing) {
          nodes.set(id, { id, name: rec.get(nameKey), t: createdAt });
        } else if (existing.t == null || (createdAt && createdAt < existing.t)) {
          existing.t = createdAt;
        }
      }
      edges.push({
        source,
        target,
        strength: rec.get("strength")?.toNumber?.() ?? 1,
        t: createdAt,
      });
    }

    return { nodes: [...nodes.values()], edges };
  } finally {
    await session.close();
  }
}

/**
 * Returns the subset of candidateIds directly connected to userId.
 * Group routes use this so callers can't harvest handles/phone numbers of
 * arbitrary users — you can only group people you've actually wafted.
 */
export async function filterConnectedUsers(
  userId: string,
  candidateIds: string[]
): Promise<string[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (me:Person {id: $userId})-[:WAFT]-(other:Person)
       WHERE other.id IN $candidateIds
       RETURN other.id AS id`,
      { userId, candidateIds }
    );
    return result.records.map((r) => r.get("id"));
  } finally {
    await session.close();
  }
}

/** Event ids the user has checked into, most recent first. */
export async function getAttendedEventIds(userId: string): Promise<string[]> {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (:Person {id: $userId})-[a:ATTENDED]->(e:Event)
       RETURN e.id AS id ORDER BY a.checkedInAt DESC`,
      { userId }
    );
    return result.records.map((r) => r.get("id"));
  } finally {
    await session.close();
  }
}

/** People the user connected with at a specific event. */
export async function getEventConnections(userId: string, eventId: string) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (:Person {id: $userId})-[r:WAFT]-(other:Person)
       WHERE $eventId IN coalesce(r.eventIds, []) OR r.eventId = $eventId
       RETURN other.id AS id, other.name AS name,
              other.avatarColor AS avatarColor, other.avatarShape AS avatarShape`,
      { userId, eventId }
    );
    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      avatarColor: r.get("avatarColor"),
      avatarShape: r.get("avatarShape"),
    }));
  } finally {
    await session.close();
  }
}

/** Whether the user has an ATTENDED edge to this specific event. */
export async function hasAttendedEvent(userId: string, eventId: string): Promise<boolean> {
  const session = getDriver().session();
  try {
    const r = await session.run(
      `MATCH (:Person {id: $userId})-[:ATTENDED]->(:Event {id: $eventId}) RETURN 1 LIMIT 1`,
      { userId, eventId }
    );
    return r.records.length > 0;
  } finally {
    await session.close();
  }
}

/** Whether two people share a WAFT edge (a mutual connection). */
export async function areConnected(a: string, b: string): Promise<boolean> {
  const session = getDriver().session();
  try {
    const r = await session.run(
      `MATCH (:Person {id: $a})-[:WAFT]-(:Person {id: $b}) RETURN 1 LIMIT 1`,
      { a, b }
    );
    return r.records.length > 0;
  } finally {
    await session.close();
  }
}

/** Whether two people have both attended a common event. */
export async function shareAnEvent(a: string, b: string): Promise<boolean> {
  const session = getDriver().session();
  try {
    const r = await session.run(
      `MATCH (:Person {id: $a})-[:ATTENDED]->(e:Event)<-[:ATTENDED]-(:Person {id: $b}) RETURN 1 LIMIT 1`,
      { a, b }
    );
    return r.records.length > 0;
  } finally {
    await session.close();
  }
}

/**
 * Removes the person and every edge they're part of (WAFT connections,
 * ATTENDED check-ins). Idempotent — a missing node is a no-op, so account
 * deletion can be retried after a partial failure.
 */
export async function deletePersonNode(userId: string) {
  const session = getDriver().session();
  try {
    await session.run(`MATCH (p:Person {id: $userId}) DETACH DELETE p`, { userId });
  } finally {
    await session.close();
  }
}

export async function checkinToEvent(userId: string, eventId: string) {
  const session = getDriver().session();
  try {
    await session.run(
      `MATCH (p:Person {id: $userId})
       MERGE (e:Event {id: $eventId})
       MERGE (p)-[r:ATTENDED]->(e)
       SET r.checkedInAt = datetime()`,
      { userId, eventId }
    );
  } finally {
    await session.close();
  }
}

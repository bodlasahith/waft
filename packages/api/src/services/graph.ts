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
      `MATCH (a:Person {id: $fromUserId}), (b:Person {id: $toUserId})
       OPTIONAL MATCH (a)-[existing:WAFT]-(b)
       WITH a, b, existing IS NOT NULL AS already
       MERGE (a)-[r:WAFT]-(b)
       ON CREATE SET r.createdAt = datetime(), r.strength = 1
       SET r.eventId = coalesce($eventId, r.eventId)
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
              toString(r.createdAt) AS createdAt, r.eventId AS eventId`,
      { ids }
    );
    const edges = edgeResult.records.map((r) => ({
      source: r.get("source"),
      target: r.get("target"),
      strength: r.get("strength").toNumber(),
      createdAt: r.get("createdAt"),
      eventId: r.get("eventId"),
    }));

    return { nodes, edges };
  } finally {
    await session.close();
  }
}

export async function getEventGraph(eventId: string) {
  const session = getDriver().session();
  try {
    // Attendees are nodes the moment they check in — the live graph should
    // show people arriving, not just people who've already connected there.
    const attendees = await session.run(
      `MATCH (p:Person)-[:ATTENDED]->(:Event {id: $eventId})
       RETURN p.id AS id, p.name AS name, p.avatarColor AS avatarColor, p.avatarShape AS avatarShape`,
      { eventId }
    );
    const result = await session.run(
      `MATCH (a:Person)-[r:WAFT {eventId: $eventId}]-(b:Person)
       RETURN DISTINCT a.id AS source, a.name AS sourceName,
              b.id AS target, b.name AS targetName, r.strength AS strength`,
      { eventId }
    );
    const nodes = new Map<
      string,
      { id: string; name: string; avatarColor?: string; avatarShape?: string }
    >();
    for (const record of attendees.records) {
      nodes.set(record.get("id"), {
        id: record.get("id"),
        name: record.get("name"),
        avatarColor: record.get("avatarColor"),
        avatarShape: record.get("avatarShape"),
      });
    }
    const edges: { source: string; target: string; strength: number }[] = [];

    for (const record of result.records) {
      const sourceId = record.get("source");
      const targetId = record.get("target");
      nodes.set(sourceId, { id: sourceId, name: record.get("sourceName") });
      nodes.set(targetId, { id: targetId, name: record.get("targetName") });
      edges.push({
        source: sourceId,
        target: targetId,
        strength: record.get("strength")?.toNumber() ?? 1,
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
       WHERE r.eventId = $eventId
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

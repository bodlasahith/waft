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
              length(shortestPath((origin)-[:WAFT*]-(connected))) AS distance`,
      { userId }
    );
    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      photoUrl: r.get("photoUrl"),
      distance: r.get("distance").toNumber(),
    }));
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
       RETURN p.id AS id, p.name AS name`,
      { eventId }
    );
    const result = await session.run(
      `MATCH (a:Person)-[r:WAFT {eventId: $eventId}]-(b:Person)
       RETURN DISTINCT a.id AS source, a.name AS sourceName,
              b.id AS target, b.name AS targetName, r.strength AS strength`,
      { eventId }
    );
    const nodes = new Map<string, { id: string; name: string }>();
    for (const record of attendees.records) {
      nodes.set(record.get("id"), { id: record.get("id"), name: record.get("name") });
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

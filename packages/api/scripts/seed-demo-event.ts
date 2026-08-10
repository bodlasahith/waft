/**
 * Seed a right-sized demo event so Event Replay produces a compelling clip for
 * host outreach — a ~35-person curated-dinner-sized room (Waft's ICP) that
 * fills in and connects over ~90 minutes.
 *
 * This is SYNTHETIC demo data, clearly namespaced and fully reversible:
 *   - Neo4j: Person ids are prefixed `demo-`; the Event has a fixed id.
 *   - Supabase: one row in `events` with a fixed id/code.
 * Seeding runs a cleanup first, so re-running is idempotent (no duplicates).
 *
 * Usage (run OFF the office network — it blocks Aura's 7687 — or Railway-side):
 *   cd packages/api
 *   npx tsx --env-file=../../.env scripts/seed-demo-event.ts          # seed
 *   npx tsx --env-file=../../.env scripts/seed-demo-event.ts --cleanup # remove
 *
 * After seeding, open the wall and record ~20s of Replay:
 *   https://getwaft.app/e/demoreplay   (→ /event/<id>, click ↺ Replay, ▶)
 *
 * NOTE: this WRITES to the production Supabase + Neo4j. It only ever touches the
 * fixed demo event + `demo-`-prefixed nodes, so it can't affect real users, and
 * --cleanup removes every trace. Do not point it at anything you can't reseed.
 */
import { getDriver, closeDriver } from "../src/lib/neo4j.js";
import { supabase } from "../src/lib/supabase.js";
import { AVATAR_COLORS, AVATAR_SHAPES } from "@waft/shared";

const EVENT_ID = "deadbeef-0000-4000-8000-000000000001";
const EVENT_CODE = "demoreplay";
const EVENT_NAME = "Founders Dinner (Demo)";
const PREFIX = "demo-";

// Deterministic RNG so every reseed produces the same clip (nice for recording).
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rng = makeRng(42);
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];

const NAMES = [
  "Maya Chen", "Diego Alvarez", "Priya Nair", "Sam Okafor", "Lena Petrov",
  "Marcus Webb", "Aisha Rahman", "Tomás Ferreira", "Grace Liu", "Noah Bennett",
  "Zoe Marković", "Kai Tanaka", "Ravi Deshpande", "Elena Costa", "Jordan Ellis",
  "Nadia Hassan", "Oliver Frank", "Sofia Reyes", "Ethan Park", "Amara Diallo",
  "Lucas Meyer", "Hana Kim", "Bilal Farooq", "Clara Nguyen", "Theo Andersson",
  "Yuki Sato", "Nathan Brooks", "Ines Moreau", "Omar Haddad", "Ava Sinclair",
  "Rafael Souza", "Mei Wong", "Daniel Cohen", "Farah Aziz", "Isla Murphy",
];

// Three loose clusters (tables), plus a few cross-table bridges — gives the
// leaderboard a clear top connector and non-empty "bridging clusters".
const CLUSTERS = 3;

interface Person {
  id: string;
  name: string;
  cluster: number;
  avatarColor: string;
  avatarShape: string;
  checkinMin: number; // minutes after event start
}

function buildPeople(): Person[] {
  return NAMES.map((name, i) => ({
    id: `${PREFIX}${i.toString().padStart(2, "0")}`,
    name,
    cluster: i % CLUSTERS,
    avatarColor: pick(AVATAR_COLORS),
    avatarShape: pick(AVATAR_SHAPES),
    // Arrivals trickle in over the first ~55 minutes.
    checkinMin: Math.round(rng() * 55),
  }));
}

interface Edge {
  a: number;
  b: number;
  atMin: number;
}

function buildEdges(people: Person[]): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a === b || seen.has(key)) return;
    seen.add(key);
    // A connection forms a few minutes after both people have arrived.
    const atMin = Math.max(people[a].checkinMin, people[b].checkinMin) + 1 + Math.round(rng() * 12);
    edges.push({ a, b, atMin });
  };

  const byCluster: number[][] = Array.from({ length: CLUSTERS }, () => []);
  people.forEach((p, i) => byCluster[p.cluster].push(i));

  // Dense-ish within each table: each person meets ~3 tablemates.
  for (const members of byCluster) {
    for (const a of members) {
      const others = members.filter((m) => m !== a);
      const k = 2 + Math.floor(rng() * 3);
      for (let n = 0; n < k; n++) add(a, pick(others));
    }
  }

  // A handful of bridges across tables — a few people work the room.
  const bridgeCount = 7;
  for (let n = 0; n < bridgeCount; n++) {
    const a = Math.floor(rng() * people.length);
    let b = Math.floor(rng() * people.length);
    while (people[b].cluster === people[a].cluster) b = Math.floor(rng() * people.length);
    add(a, b);
  }
  return edges;
}

async function cleanup() {
  const session = getDriver().session();
  try {
    await session.run(`MATCH (p:Person) WHERE p.id STARTS WITH $prefix DETACH DELETE p`, {
      prefix: PREFIX,
    });
    await session.run(`MATCH (e:Event {id: $id}) DETACH DELETE e`, { id: EVENT_ID });
  } finally {
    await session.close();
  }
  await supabase.from("events").delete().eq("id", EVENT_ID);
  console.log("cleaned up demo event + demo-* people");
}

async function seed() {
  await cleanup(); // idempotent — start from a clean slate

  const people = buildPeople();
  const edges = buildEdges(people);

  // Anchor the whole event ~95 min ago so the wall is fresh (unbounded walls
  // expire 48h after start) and the replay clock reads like it just happened.
  const startMs = Date.now() - 95 * 60_000;
  const startIso = new Date(startMs).toISOString();
  const atIso = (min: number) => new Date(startMs + min * 60_000).toISOString();

  // Supabase: the event row (name + code + bounds power /timeline and the link).
  const { error } = await supabase.from("events").upsert({
    id: EVENT_ID,
    name: EVENT_NAME,
    code: EVENT_CODE,
    location: "San Francisco",
    starts_at: startIso,
    ends_at: null,
    created_by: null,
    icebreakers: [
      "What are you building, in one sentence?",
      "What's the last thing that made you rethink your roadmap?",
      "Who at this table should you have met a year ago?",
    ],
  });
  if (error) throw new Error(`supabase events upsert failed: ${error.message}`);

  const session = getDriver().session();
  try {
    await session.run(`MERGE (e:Event {id: $id}) SET e.name = $name`, {
      id: EVENT_ID,
      name: EVENT_NAME,
    });

    // People + their check-ins (ATTENDED.checkedInAt drives node appearance).
    for (const p of people) {
      await session.run(
        `MERGE (p:Person {id: $id})
         SET p.name = $name, p.avatarColor = $color, p.avatarShape = $shape
         WITH p
         MATCH (e:Event {id: $eventId})
         MERGE (p)-[a:ATTENDED]->(e)
         SET a.checkedInAt = datetime($checkedInAt)`,
        {
          id: p.id,
          name: p.name,
          color: p.avatarColor,
          shape: p.avatarShape,
          eventId: EVENT_ID,
          checkedInAt: atIso(p.checkinMin),
        }
      );
    }

    // Connections (WAFT.createdAt drives edge appearance; eventId tags the wall).
    for (const e of edges) {
      await session.run(
        `MATCH (a:Person {id: $aId}), (b:Person {id: $bId})
         MERGE (a)-[r:WAFT]-(b)
         ON CREATE SET r.strength = 1, r.eventIds = []
         SET r.eventIds = CASE WHEN $eventId IN coalesce(r.eventIds, []) THEN r.eventIds
                               ELSE coalesce(r.eventIds, []) + $eventId END,
             r.createdAt = datetime($createdAt)`,
        {
          aId: people[e.a].id,
          bId: people[e.b].id,
          eventId: EVENT_ID,
          createdAt: atIso(e.atMin),
        }
      );
    }
  } finally {
    await session.close();
  }

  console.log(`seeded "${EVENT_NAME}": ${people.length} people, ${edges.length} connections`);
  console.log(`wall:   https://getwaft.app/e/${EVENT_CODE}`);
  console.log(`replay: open the wall, click ↺ Replay, then ▶`);
}

const mode = process.argv.includes("--cleanup") ? cleanup : seed;
mode()
  .then(() => closeDriver())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await closeDriver();
    process.exit(1);
  });

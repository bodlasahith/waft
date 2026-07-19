export interface AnalyticsNode {
  id: string;
  name: string;
}

export interface AnalyticsEdge {
  source: string;
  target: string;
}

export interface RankedPerson {
  id: string;
  name: string;
  score: number;
}

export interface GraphStats {
  people: number;
  wafts: number;
  /** 0..1 — fraction of possible connections that exist */
  density: number;
  /** Highest-degree people (most direct connections), descending */
  topConnectors: RankedPerson[];
  /** Highest betweenness centrality — people who bridge otherwise-separate clusters */
  topBridges: RankedPerson[];
}

/**
 * Small-graph analytics computed client-side (Aura Free has no GDS library,
 * and event graphs are small enough that Brandes runs in microseconds).
 * Shared between the web event wall and the mobile network tab.
 */
export function computeGraphStats(
  nodes: AnalyticsNode[],
  edges: AnalyticsEdge[],
  topN = 3
): GraphStats {
  const ids = nodes.map((n) => n.id);
  const names = new Map(nodes.map((n) => [n.id, n.name]));
  const adj = new Map<string, string[]>(ids.map((id) => [id, []]));
  let waftCount = 0;
  for (const e of edges) {
    if (!adj.has(e.source) || !adj.has(e.target) || e.source === e.target) continue;
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
    waftCount++;
  }

  const degree = new Map(ids.map((id) => [id, adj.get(id)!.length]));
  const betweenness = brandes(ids, adj);

  const rank = (scores: Map<string, number>): RankedPerson[] =>
    [...scores.entries()]
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([id, score]) => ({ id, name: names.get(id) ?? "?", score }));

  const n = ids.length;
  return {
    people: n,
    wafts: waftCount,
    density: n < 2 ? 0 : (2 * waftCount) / (n * (n - 1)),
    topConnectors: rank(degree),
    topBridges: rank(betweenness),
  };
}

/** Brandes' betweenness centrality for unweighted undirected graphs. */
function brandes(ids: string[], adj: Map<string, string[]>): Map<string, number> {
  const cb = new Map(ids.map((id) => [id, 0]));
  for (const s of ids) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(ids.map((id) => [id, []]));
    const sigma = new Map(ids.map((id) => [id, 0]));
    const dist = new Map(ids.map((id) => [id, -1]));
    sigma.set(s, 1);
    dist.set(s, 0);
    const queue: string[] = [s];
    for (let qi = 0; qi < queue.length; qi++) {
      const v = queue[qi];
      stack.push(v);
      for (const w of adj.get(v)!) {
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }
    const delta = new Map(ids.map((id) => [id, 0]));
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      }
      if (w !== s) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }
  // undirected graphs count each path twice
  for (const id of ids) cb.set(id, cb.get(id)! / 2);
  return cb;
}

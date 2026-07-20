"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { computeGraphStats } from "@waft/shared";

const EventGraph = dynamic(() => import("@/components/EventGraph"), { ssr: false });

interface GraphNode {
  id: string;
  name: string;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [eventId, setEventId] = useState<string>("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    params.then(({ eventId }) => {
      setEventId(eventId);
      fetchGraph(eventId);
      connectWebSocket(eventId);
    });
  }, [params]);

  async function fetchGraph(id: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/events/${id}/graph`);
    if (res.status === 410) setExpired(true);
    else if (res.ok) setGraphData(await res.json());
  }

  function connectWebSocket(id: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(`${wsUrl}/events/${id}/live`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // The API pushes a full graph snapshot on connect and after every
      // check-in or connection at this event.
      if (msg.type === "graph") {
        setGraphData({ nodes: msg.nodes ?? [], edges: msg.edges ?? [] });
      } else if (msg.type === "expired") {
        setExpired(true);
      }
    };

    return () => ws.close();
  }

  const [topN, setTopN] = useState(5);
  const stats = useMemo(
    () => computeGraphStats(graphData.nodes, graphData.edges, topN),
    [graphData, topN]
  );
  // id -> rank, so the graph can crown + glow the leaders.
  const highlights = useMemo(() => {
    const h: Record<string, number> = {};
    stats.topConnectors.forEach((p, i) => (h[p.id] = i + 1));
    return h;
  }, [stats]);

  if (expired) {
    return (
      <main className="h-screen w-screen flex flex-col items-center justify-center gap-3 p-8">
        <h1 className="text-3xl font-bold">This event has ended</h1>
        <p className="text-neutral-400 text-center max-w-md">
          The live wall is no longer available. The connections made here live on in
          everyone&apos;s networks.
        </p>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen relative">
      <div className="absolute top-4 left-4 z-10 bg-neutral-900/80 backdrop-blur px-4 py-2 rounded-lg">
        <h1 className="text-lg font-semibold">Live Event Graph</h1>
        <p className="text-sm text-neutral-400">
          {stats.people} people · {stats.wafts} wafts
          {stats.people >= 3 && ` · ${Math.round(stats.density * 100)}% connected`}
        </p>
      </div>

      {(stats.topConnectors.length > 0 || stats.topBridges.length > 0) && (
        <div className="absolute top-4 right-4 z-10 bg-neutral-900/80 backdrop-blur px-4 py-3 rounded-lg w-60">
          {stats.topConnectors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold">
                  🏆 Leaderboard
                </p>
                <div className="flex gap-1">
                  {[3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTopN(n)}
                      className={`text-xs px-1.5 rounded ${
                        topN === n ? "bg-white text-black" : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {stats.topConnectors.map((p, i) => {
                const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm py-0.5">
                    <span className="truncate">
                      <span className="mr-1">{medal}</span>
                      {p.name}
                    </span>
                    <span className="text-neutral-400 tabular-nums">{p.score}</span>
                  </div>
                );
              })}
            </div>
          )}
          {stats.topBridges.length > 0 && (
            <div className="mt-3 pt-2 border-t border-neutral-700">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Bridging clusters</p>
              {stats.topBridges.map((p) => (
                <p key={p.id} className="text-sm">
                  🌉 {p.name}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <EventGraph nodes={graphData.nodes} edges={graphData.edges} highlights={highlights} />
    </main>
  );
}

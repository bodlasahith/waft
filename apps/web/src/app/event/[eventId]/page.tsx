"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// Timestamped graph for Replay. `t` is an ISO string: a node's appearance
// time (check-in) and an edge's creation time (connection).
interface TimelineNode extends GraphNode {
  t: string | null;
}
interface TimelineEdge extends GraphEdge {
  t: string | null;
}
interface Timeline {
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  nodes: TimelineNode[];
  edges: TimelineEdge[];
}

// A long event should still replay in a satisfying ~20s once you hit play.
const REPLAY_DURATION_MS = 20_000;

export default function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [eventId, setEventId] = useState<string>("");
  const [expired, setExpired] = useState(false);

  // Replay state. `mode` swaps the wall between the live WS graph and a
  // scrubbable reconstruction; the live socket keeps running underneath.
  const [mode, setMode] = useState<"live" | "replay">("live");
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [replayT, setReplayT] = useState(0); // epoch ms, current scrubber position
  const replayTRef = useRef(0); // authoritative position for the rAF loop
  const [playing, setPlaying] = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);

  // Single point that moves the scrubber, keeping state + ref in lockstep.
  const seek = (t: number) => {
    replayTRef.current = t;
    setReplayT(t);
  };

  // Live socket with auto-reconnect. Previously the socket had no onclose and
  // its cleanup closure was never wired in, so a single WiFi blip froze the
  // projected wall for the rest of the event. Now it reconnects with jittered
  // exponential backoff and tears down cleanly on unmount / wall expiry.
  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

    async function fetchGraph(id: string) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/events/${id}/graph`);
      if (res.status === 410) setExpired(true);
      else if (res.ok) setGraphData(await res.json());
    }

    function open(id: string) {
      if (cancelled) return;
      ws = new WebSocket(`${wsUrl}/events/${id}/live`);
      ws.onopen = () => {
        attempt = 0; // reset backoff once a connection succeeds
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        // Full graph snapshot on connect and after every check-in/connection.
        if (msg.type === "graph") {
          setGraphData({ nodes: msg.nodes ?? [], edges: msg.edges ?? [] });
        } else if (msg.type === "expired") {
          setExpired(true);
          cancelled = true; // a dead wall shouldn't be reconnected
          ws?.close();
        }
      };
      ws.onclose = () => {
        if (cancelled) return;
        // 1s, 2s, 4s… capped at 30s, ±50% jitter so a venue-wide blip doesn't
        // reconnect every wall in lockstep (a thundering herd into the API).
        const base = Math.min(30000, 1000 * 2 ** attempt);
        attempt++;
        reconnectTimer = setTimeout(() => open(id), base * (0.5 + Math.random()));
      };
      ws.onerror = () => ws?.close(); // surfaces as onclose → reconnect
    }

    params.then(({ eventId }) => {
      if (cancelled) return;
      setEventId(eventId);
      fetchGraph(eventId);
      open(eventId);
    });

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [params]);

  // [start, end] epoch ms across all timestamps — the scrubber's range.
  const bounds = useMemo(() => {
    if (!timeline) return null;
    const ts = [...timeline.nodes, ...timeline.edges]
      .map((x) => x.t)
      .filter((s): s is string => !!s)
      .map((s) => new Date(s).getTime());
    if (ts.length === 0) return null;
    const t0 = Math.min(...ts);
    const t1 = Math.max(...ts);
    return { t0, t1: t1 > t0 ? t1 : t0 + 1 };
  }, [timeline]);

  // The room exactly as it stood at replayT: everyone who'd appeared, and the
  // connections made by then (both endpoints must already be present).
  const replayGraph = useMemo<GraphData>(() => {
    if (!timeline) return { nodes: [], edges: [] };
    const nodes = timeline.nodes.filter((n) => !n.t || new Date(n.t).getTime() <= replayT);
    const present = new Set(nodes.map((n) => n.id));
    const edges = timeline.edges.filter(
      (e) => e.t && new Date(e.t).getTime() <= replayT && present.has(e.source) && present.has(e.target)
    );
    return {
      nodes: nodes.map((n) => ({ id: n.id, name: n.name })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, strength: e.strength })),
    };
  }, [timeline, replayT]);

  // Auto-advance while playing: map the whole event span onto REPLAY_DURATION_MS
  // of wall-clock, stopping at the end.
  useEffect(() => {
    if (mode !== "replay" || !playing || !bounds) return;
    let raf = 0;
    let last: number | null = null;
    const speed = (bounds.t1 - bounds.t0) / REPLAY_DURATION_MS; // event-ms per real-ms
    const step = (now: number) => {
      if (last != null) {
        const next = Math.min(replayTRef.current + (now - last) * speed, bounds.t1);
        seek(next);
        if (next >= bounds.t1) {
          setPlaying(false); // reached the end — stop cleanly
          return;
        }
      }
      last = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mode, playing, bounds]);

  async function enterReplay() {
    setReplayError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    try {
      const res = await fetch(`${apiUrl}/events/${eventId}/timeline`);
      if (res.status === 410) {
        setReplayError("Replay isn't available — this event's wall has expired.");
        return;
      }
      if (!res.ok) {
        setReplayError("Couldn't load the replay.");
        return;
      }
      const data: Timeline = await res.json();
      setTimeline(data);
      // Open on the full room, then let the host scrub back or play from empty.
      const ts = [...data.nodes, ...data.edges]
        .map((x) => x.t)
        .filter((s): s is string => !!s)
        .map((s) => new Date(s).getTime());
      seek(ts.length ? Math.max(...ts) : 0);
      setPlaying(false);
      setMode("replay");
    } catch {
      setReplayError("Couldn't load the replay.");
    }
  }

  function exitReplay() {
    setPlaying(false);
    setMode("live");
  }

  function togglePlay() {
    if (!bounds) return;
    // Replaying from the end restarts from the empty room.
    if (!playing && replayT >= bounds.t1) seek(bounds.t0);
    setPlaying((p) => !p);
  }

  const displayGraph = mode === "replay" ? replayGraph : graphData;

  const [topN, setTopN] = useState(5);
  const stats = useMemo(
    () => computeGraphStats(displayGraph.nodes, displayGraph.edges, topN),
    [displayGraph, topN]
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
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">
            {mode === "replay" ? "Replay" : "Live Event Graph"}
          </h1>
          {mode === "live" ? (
            <button
              onClick={enterReplay}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              title="Replay this event's network forming"
            >
              ↺ Replay
            </button>
          ) : (
            <button
              onClick={exitReplay}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              ← Live
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-400">
          {stats.people} people · {stats.wafts} wafts
          {stats.people >= 3 && ` · ${Math.round(stats.density * 100)}% connected`}
        </p>
        {replayError && <p className="text-xs text-amber-400 mt-1">{replayError}</p>}
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

      <EventGraph nodes={displayGraph.nodes} edges={displayGraph.edges} highlights={highlights} />

      {mode === "replay" && bounds && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[min(680px,90vw)] bg-neutral-900/85 backdrop-blur px-5 py-4 rounded-xl flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="shrink-0 w-10 h-10 rounded-full bg-white text-black text-lg flex items-center justify-center hover:bg-neutral-200 transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : replayT >= bounds.t1 ? "↺" : "▶"}
          </button>
          <input
            type="range"
            min={bounds.t0}
            max={bounds.t1}
            value={Math.min(Math.max(replayT, bounds.t0), bounds.t1)}
            onChange={(e) => {
              setPlaying(false);
              seek(Number(e.target.value));
            }}
            className="flex-1 accent-[#6C8CFF]"
          />
          <span className="shrink-0 text-sm text-neutral-300 tabular-nums w-20 text-right">
            {new Date(replayT).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
    if (res.ok) setGraphData(await res.json());
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
      }
    };

    return () => ws.close();
  }

  return (
    <main className="h-screen w-screen relative">
      <div className="absolute top-4 left-4 z-10 bg-neutral-900/80 backdrop-blur px-4 py-2 rounded-lg">
        <h1 className="text-lg font-semibold">Live Event Graph</h1>
        <p className="text-sm text-neutral-400">
          {graphData.nodes.length} people · {graphData.edges.length} wafts
        </p>
      </div>
      <EventGraph nodes={graphData.nodes} edges={graphData.edges} />
    </main>
  );
}

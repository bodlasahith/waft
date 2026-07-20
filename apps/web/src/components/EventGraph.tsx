"use client";

import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";

interface Props {
  nodes: { id: string; name: string }[];
  edges: { source: string; target: string; strength: number }[];
  // id -> rank (1-based) for the event leaderboard; top nodes get a crown + glow.
  highlights?: Record<string, number>;
}

const MEDAL = ["", "🥇", "🥈", "🥉"];
function rankLabel(rank: number, name: string) {
  const medal = MEDAL[rank] ?? "👑";
  return `${medal} ${name}`;
}
function rankColor(rank: number) {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#D8D8E0";
  if (rank === 3) return "#E0A66B";
  return "#8FA6FF";
}

export default function EventGraph({ nodes, edges, highlights = {} }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph();
    graphRef.current = graph;

    const renderer = new Sigma(graph, containerRef.current, {
      defaultNodeColor: "#ffffff",
      defaultEdgeColor: "#444444",
      labelColor: { color: "#ffffff" },
      labelFont: "Inter, system-ui, sans-serif",
      defaultNodeType: "circle",
    });
    sigmaRef.current = renderer;

    return () => {
      renderer.kill();
    };
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    for (const node of nodes) {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          label: node.name,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 8,
          color: "#ffffff",
        });
      }
      // Restyle every refresh so the leaderboard updates live as the wall grows.
      const rank = highlights[node.id];
      graph.setNodeAttribute(node.id, "label", rank ? rankLabel(rank, node.name) : node.name);
      graph.setNodeAttribute(node.id, "color", rank ? rankColor(rank) : "#ffffff");
      graph.setNodeAttribute(node.id, "size", rank ? 20 - rank * 1.5 : 8);
    }

    for (const edge of edges) {
      const edgeKey = `${edge.source}-${edge.target}`;
      if (!graph.hasEdge(edgeKey) && graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
          size: edge.strength,
          color: "#555555",
        });
      }
    }

    sigmaRef.current?.refresh();
  }, [nodes, edges, highlights]);

  return <div ref={containerRef} className="w-full h-full bg-neutral-950" />;
}

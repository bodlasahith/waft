"use client";

import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";

interface Props {
  nodes: { id: string; name: string }[];
  edges: { source: string; target: string; strength: number }[];
  // id -> rank (1-based) for the event leaderboard; top nodes get a crown + glow.
  highlights?: Record<string, number>;
}

// Brand (DESIGN.md): dark indigo ground, periwinkle network.
const GROUND = "#0a0d15";
const NODE_COLOR = "#c9d6ff";
const EDGE_COLOR = "#39457e";

// Coalesce: nodes scale in and edges grow as they're added, while the force
// layout drifts everyone into place — the network "gathers" as people arrive.
const NODE_DUR = 900;
const EDGE_DUR = 650;
const RUN_WINDOW = 4000; // keep the layout/animation loop alive after a change

const FA2_SETTINGS = {
  gravity: 1.4,
  scalingRatio: 16,
  strongGravityMode: true,
  adjustSizes: true,
  barnesHutOptimize: false,
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
// Slight overshoot so a node "pops" as it settles.
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const MEDAL = ["", "🥇", "🥈", "🥉"];
function rankLabel(rank: number, name: string) {
  return `${MEDAL[rank] ?? "👑"} ${name}`;
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

  const nodeBirth = useRef(new Map<string, number>());
  const edgeBirth = useRef(new Map<string, number>());
  const runUntil = useRef(0);
  const rafRef = useRef<number | null>(null);
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph();
    graphRef.current = graph;

    const renderer = new Sigma(graph, containerRef.current, {
      defaultNodeColor: NODE_COLOR,
      defaultEdgeColor: EDGE_COLOR,
      labelColor: { color: "#c9d6ff" },
      labelFont: "system-ui, sans-serif",
      labelSize: 13,
      defaultNodeType: "circle",
      // Per-frame birth animation on top of each element's settled size.
      nodeReducer: (node, data) => {
        const b = nodeBirth.current.get(node);
        if (b == null) return data;
        const t = Math.min(1, (performance.now() - b) / NODE_DUR);
        if (t >= 1) return data;
        return { ...data, size: Math.max(0.1, (data.size as number) * easeOutBack(t)) };
      },
      edgeReducer: (edge, data) => {
        const b = edgeBirth.current.get(edge);
        if (b == null) return data;
        const t = Math.min(1, (performance.now() - b) / EDGE_DUR);
        if (t >= 1) return data;
        return { ...data, size: Math.max(0.1, (data.size as number) * easeOut(t)) };
      },
    });
    sigmaRef.current = renderer;

    function tick() {
      const now = performance.now();
      // Continuous force layout: 1 iteration/frame nudges nodes into place and
      // keeps the network gently drifting (it re-reads the graph, so nodes
      // added live get laid out too).
      if (graph.order > 0) forceAtlas2.assign(graph, { iterations: 1, settings: FA2_SETTINGS });
      renderer.refresh();

      // Keep running while the layout is still settling or a birth animation
      // is in flight; otherwise idle (freeze positions, stop the loop).
      let animating = now < runUntil.current;
      if (!animating) {
        for (const b of nodeBirth.current.values()) if (now - b < NODE_DUR) animating = true;
      }
      if (animating) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    }

    kickRef.current = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };
    kickRef.current();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      renderer.kill();
    };
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const now = performance.now();

    for (const node of nodes) {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          label: node.name,
          // Seed near center + jitter; the force layout spreads them out.
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6,
          size: 9,
          color: NODE_COLOR,
        });
        nodeBirth.current.set(node.id, now);
      }
      const rank = highlights[node.id];
      graph.setNodeAttribute(node.id, "label", rank ? rankLabel(rank, node.name) : node.name);
      graph.setNodeAttribute(node.id, "color", rank ? rankColor(rank) : NODE_COLOR);
      graph.setNodeAttribute(node.id, "size", rank ? 22 - rank * 1.5 : 9);
    }

    for (const edge of edges) {
      const key = `${edge.source}-${edge.target}`;
      if (!graph.hasEdge(key) && graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdgeWithKey(key, edge.source, edge.target, {
          size: Math.max(1.5, edge.strength * 1.5),
          color: EDGE_COLOR,
        });
        edgeBirth.current.set(key, now);
      }
    }

    runUntil.current = now + RUN_WINDOW;
    kickRef.current();
    sigmaRef.current?.refresh();
  }, [nodes, edges, highlights]);

  return <div ref={containerRef} className="w-full h-full" style={{ background: GROUND }} />;
}

"use client";

import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";

interface Props {
  nodes: { id: string; name: string }[];
  edges: { source: string; target: string; strength: number }[];
}

export default function EventGraph({ nodes, edges }: Props) {
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
  }, [nodes, edges]);

  return <div ref={containerRef} className="w-full h-full bg-neutral-950" />;
}

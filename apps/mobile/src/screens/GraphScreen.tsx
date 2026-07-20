import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { G, Line, Text as SvgText } from "react-native-svg";
import { computeGraphStats } from "@waft/shared";
import { api, PublicCard } from "../api";
import { AvatarNode } from "../components/AvatarNode";

interface Node {
  id: string;
  name: string;
  distance: number; // 0 = you
  avatarColor?: string | null;
  avatarShape?: string | null;
}
interface Edge {
  source: string;
  target: string;
  strength: number;
  createdAt?: string | null;
  eventId?: string | null;
  eventName?: string;
}

const SOCIAL_URLS: Record<string, string> = {
  instagram: "https://instagram.com/",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
  x: "https://x.com/",
  tiktok: "https://tiktok.com/@",
  reddit: "https://reddit.com/u/",
  spotify: "https://open.spotify.com/user/",
  facebook: "https://facebook.com/",
};

/**
 * Small force layout: radial seed by hop distance, then spring relaxation.
 * Deterministic at demo scale (< ~80 nodes); "you" stays pinned center.
 * Computed once per graph load — no animation loop.
 */
function computeLayout(nodes: Node[], edges: Edge[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const pos = new Map<string, { x: number; y: number }>();
  const ring = (Math.min(width, height) / 3.2) * 0.62;

  const byDistance = new Map<number, Node[]>();
  for (const n of nodes) {
    const bucket = byDistance.get(n.distance) ?? [];
    bucket.push(n);
    byDistance.set(n.distance, bucket);
  }
  for (const [distance, bucket] of byDistance) {
    bucket.forEach((n, i) => {
      if (distance === 0) {
        pos.set(n.id, { x: cx, y: cy });
        return;
      }
      const angle = (2 * Math.PI * i) / bucket.length + distance;
      pos.set(n.id, {
        x: cx + ring * distance * Math.cos(angle),
        y: cy + ring * distance * Math.sin(angle),
      });
    });
  }

  for (let iter = 0; iter < 120; iter++) {
    const force = new Map<string, { x: number; y: number }>();
    for (const n of nodes) force.set(n.id, { x: 0, y: 0 });

    // pairwise repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos.get(nodes[i].id)!;
        const b = pos.get(nodes[j].id)!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 25);
        const d = Math.sqrt(d2);
        const f = ((ring * ring) / d2) * 4;
        force.get(nodes[i].id)!.x += (dx / d) * f;
        force.get(nodes[i].id)!.y += (dy / d) * f;
        force.get(nodes[j].id)!.x -= (dx / d) * f;
        force.get(nodes[j].id)!.y -= (dy / d) * f;
      }
    }
    // spring attraction along edges
    for (const e of edges) {
      const a = pos.get(e.source);
      const b = pos.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = (d - ring) * 0.05;
      force.get(e.source)!.x += (dx / d) * f;
      force.get(e.source)!.y += (dy / d) * f;
      force.get(e.target)!.x -= (dx / d) * f;
      force.get(e.target)!.y -= (dy / d) * f;
    }
    for (const n of nodes) {
      if (n.distance === 0) continue; // you stay centered
      const p = pos.get(n.id)!;
      const f = force.get(n.id)!;
      p.x = Math.min(width - 40, Math.max(40, p.x + f.x));
      p.y = Math.min(height - 60, Math.max(40, p.y + f.y));
    }
  }
  return pos;
}

export function GraphScreen() {
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicCard | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Pinch-to-zoom and drag-to-pan. Plain PanResponder — taps fall through to
  // nodes/edges (we only claim the gesture once it moves or goes two-finger).
  // Zoom is anchored at the pinch midpoint: each step scales incrementally and
  // re-solves the translation so the world point under the fingers stays put.
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const gesture = useRef({
    baseScale: 1,
    baseTx: 0,
    baseTy: 0,
    offsetX: 0,
    offsetY: 0,
    pinch: null as { dist: number; focal: { x: number; y: number } } | null,
  });
  const containerRef = useRef<View>(null);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gs) =>
        evt.nativeEvent.touches.length === 2 || Math.abs(gs.dx) + Math.abs(gs.dy) > 8,
      onPanResponderMove: (evt, gs) => {
        const g = gesture.current;
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          const [t0, t1] = touches;
          const dist = Math.hypot(t0.pageX - t1.pageX, t0.pageY - t1.pageY);
          const focal = {
            x: (t0.pageX + t1.pageX) / 2 - g.offsetX,
            y: (t0.pageY + t1.pageY) / 2 - g.offsetY,
          };
          if (!g.pinch) {
            g.pinch = { dist, focal };
            return;
          }
          const prev = g.pinch;
          setView((v) => {
            const target = Math.min(4, Math.max(0.4, v.scale * (dist / prev.dist)));
            const k = target / v.scale;
            return {
              scale: target,
              tx: focal.x - k * (focal.x - v.tx) + (focal.x - prev.focal.x),
              ty: focal.y - k * (focal.y - v.ty) + (focal.y - prev.focal.y),
            };
          });
          g.pinch = { dist, focal };
        } else {
          setView((v) => {
            if (g.pinch) {
              // pinch → single-finger: rebase so the pan doesn't jump
              g.pinch = null;
              g.baseScale = v.scale;
              g.baseTx = v.tx - gs.dx;
              g.baseTy = v.ty - gs.dy;
            }
            return { scale: g.baseScale, tx: g.baseTx + gs.dx, ty: g.baseTy + gs.dy };
          });
        }
      },
      onPanResponderRelease: () => {
        const g = gesture.current;
        setView((v) => {
          g.baseScale = v.scale;
          g.baseTx = v.tx;
          g.baseTy = v.ty;
          g.pinch = null;
          return v;
        });
      },
    })
  ).current;

  function resetView() {
    const g = gesture.current;
    g.baseScale = 1;
    g.baseTx = 0;
    g.baseTy = 0;
    g.pinch = null;
    setView({ scale: 1, tx: 0, ty: 0 });
  }

  const load = useCallback(async () => {
    try {
      const [me, g] = await Promise.all([api.me(), api.myGraph()]);
      setGraph({
        nodes: [
          {
            id: me.id,
            name: me.name,
            distance: 0,
            avatarColor: me.avatar?.color,
            avatarShape: me.avatar?.shape,
          },
          ...g.nodes,
        ],
        edges: g.edges,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.status === 401 ? "Sign in to see your network." : "Couldn't load your network.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openProfile(node: Node) {
    if (node.distance === 0) return; // that's you
    setSelectedLoading(true);
    try {
      setSelected(await api.userCard(node.id));
    } finally {
      setSelectedLoading(false);
    }
  }

  const { width, height } = Dimensions.get("window");
  const svgHeight = height - 230;

  const positions = useMemo(
    () => (graph ? computeLayout(graph.nodes, graph.edges, width, svgHeight) : null),
    [graph, width, svgHeight]
  );

  // Edge encoding: thickness = waft strength, opacity = mutual connections
  // (shared neighbors pull an edge visually forward), color = whether the
  // edge is yours or fringe. Interaction-driven styling lands with the
  // waft-strength counters (see roadmap).
  const edgeStyles = useMemo(() => {
    if (!graph) return new Map<string, { opacity: number; mine: boolean }>();
    const neighbors = new Map<string, Set<string>>();
    for (const e of graph.edges) {
      if (!neighbors.has(e.source)) neighbors.set(e.source, new Set());
      if (!neighbors.has(e.target)) neighbors.set(e.target, new Set());
      neighbors.get(e.source)!.add(e.target);
      neighbors.get(e.target)!.add(e.source);
    }
    const meId = graph.nodes.find((n) => n.distance === 0)?.id;
    const styles = new Map<string, { opacity: number; mine: boolean }>();
    for (const e of graph.edges) {
      const a = neighbors.get(e.source) ?? new Set();
      const b = neighbors.get(e.target) ?? new Set();
      let mutuals = 0;
      for (const n of a) if (b.has(n)) mutuals++;
      styles.set(`${e.source}-${e.target}`, {
        opacity: Math.min(0.45 + mutuals * 0.25, 1),
        mine: e.source === meId || e.target === meId,
      });
    }
    return styles;
  }, [graph]);

  if (error && !graph) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }
  if (!graph || !positions) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (graph.nodes.length === 1) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Just you so far</Text>
        <Text style={styles.muted}>Scan someone's card and watch your network grow.</Text>
      </View>
    );
  }

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={() =>
        containerRef.current?.measureInWindow((x, y) => {
          gesture.current.offsetX = x;
          gesture.current.offsetY = y;
        })
      }
      {...panResponder.panHandlers}
    >
      <Svg width={width} height={svgHeight}>
        <G transform={`translate(${view.tx},${view.ty}) scale(${view.scale})`}>
        {graph.edges.map((e) => {
          const a = positions.get(e.source);
          const b = positions.get(e.target);
          if (!a || !b) return null;
          const style = edgeStyles.get(`${e.source}-${e.target}`);
          return (
            <G key={`${e.source}-${e.target}`}>
              <Line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={style?.mine ? "#7ba0ff" : "#c9d4f2"}
                strokeOpacity={style?.opacity ?? 0.6}
                strokeWidth={Math.min(1 + e.strength, 5)}
              />
              {/* invisible fat twin so a 2px line is actually tappable */}
              <Line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#000"
                strokeOpacity={0.01}
                strokeWidth={22}
                onPress={() => setSelectedEdge(e)}
              />
            </G>
          );
        })}
        {graph.nodes.map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          const isMe = n.distance === 0;
          const r = isMe ? 26 : n.distance === 1 ? 20 : 14;
          const fallback = isMe ? "#4a7dff" : n.distance === 1 ? "#7ba0ff" : "#b8c8f5";
          return (
            <G key={n.id}>
              <AvatarNode
                x={p.x}
                y={p.y}
                r={r}
                color={n.avatarColor ?? fallback}
                shape={n.avatarShape}
                initial={n.name.charAt(0).toUpperCase()}
                onPress={() => openProfile(n)}
              />
              <SvgText x={p.x} y={p.y + r + 16} fontSize={11} fill="#555" textAnchor="middle">
                {isMe ? "You" : n.name.split(" ")[0]}
              </SvgText>
            </G>
          );
        })}
        </G>
      </Svg>

      {(view.scale !== 1 || view.tx !== 0 || view.ty !== 0) && (
        <Pressable style={styles.resetButton} onPress={resetView}>
          <Text style={styles.resetText}>Reset view</Text>
        </Pressable>
      )}

      <Text style={styles.hint}>
        {graph.nodes.filter((n) => n.distance === 1).length} direct ·{" "}
        {graph.nodes.filter((n) => n.distance > 1).length} extended ·{" "}
        {computeGraphStats(graph.nodes, graph.edges).wafts} wafts — tap nodes and edges, pinch to
        zoom
      </Text>

      {selectedEdge && (
        <Pressable style={styles.overlay} onPress={() => setSelectedEdge(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetName}>
              {graph.nodes.find((n) => n.id === selectedEdge.source)?.name.split(" ")[0] ?? "?"}
              {" ↔ "}
              {graph.nodes.find((n) => n.id === selectedEdge.target)?.name.split(" ")[0] ?? "?"}
            </Text>
            <View style={styles.socialRow}>
              <Text style={styles.socialPlatform}>Waft strength</Text>
              <Text style={styles.socialHandle}>{selectedEdge.strength}</Text>
            </View>
            {selectedEdge.createdAt && (
              <View style={styles.socialRow}>
                <Text style={styles.socialPlatform}>Connected</Text>
                <Text style={styles.socialHandle}>
                  {new Date(selectedEdge.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              </View>
            )}
            <View style={styles.socialRow}>
              <Text style={styles.socialPlatform}>Where</Text>
              <Text style={styles.socialHandle}>
                {selectedEdge.eventName ?? (selectedEdge.eventId ? "an event" : "in the wild")}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedEdge(null)}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {(selected || selectedLoading) && (
        <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {selectedLoading || !selected ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.sheetName}>{selected.name}</Text>
                {selected.socials.length === 0 && (
                  <Text style={styles.muted}>No public links yet.</Text>
                )}
                {selected.socials.map((s) => (
                  <Pressable
                    key={s.platform}
                    style={styles.socialRow}
                    onPress={() => {
                      const url =
                        s.url ??
                        (SOCIAL_URLS[s.platform] ? SOCIAL_URLS[s.platform] + s.handle : undefined);
                      if (url) Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.socialPlatform}>{s.platform}</Text>
                    <Text style={styles.socialHandle}>{s.handle}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setSelected(null)}>
                  <Text style={styles.close}>Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  muted: { color: "#888", textAlign: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  hint: { color: "#888", fontSize: 12, textAlign: "center", marginTop: 4 },
  resetButton: {
    position: "absolute",
    top: 10,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetText: { color: "#4a7dff", fontSize: 12, fontWeight: "600" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 10,
    minHeight: 180,
  },
  sheetName: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  socialPlatform: { fontWeight: "600", textTransform: "capitalize" },
  socialHandle: { color: "#4a7dff" },
  close: { color: "#888", textAlign: "center", paddingTop: 12 },
});

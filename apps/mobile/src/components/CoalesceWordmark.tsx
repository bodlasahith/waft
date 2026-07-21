import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// The "Coalesce" wordmark (DESIGN.md): the ribbon-W lockup — the icon's
// folded-ribbon W beside "aft" — in the RN approximation of the web
// feTurbulence reveal: ribs fade in staggered and the letters gather into
// place (letter-spacing tightens) over a soft glow while wispy tendrils draw
// through, then ambient wisps keep drifting by at random short intervals.
// feTurbulence isn't reliable in RN, so this keeps the feel, not the smoke.

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// All geometry lives in the same 600x240 space as the web mark.
const VIEWBOX = "0 0 600 240";
const REVEAL_WISPS = [
  "M70 138 C 120 108,150 168,205 138",
  "M320 138 C 370 166,420 108,475 136",
  "M120 178 C 180 193,240 173,300 186",
];
const WISP_LEN = 300;

// Ribbon-W, lowercase-w silhouette — symmetric tips on the x-line, wider
// stance and higher middle peak than the icon's W, so it reads as the "w" in
// "waft" rather than a capital. Same local space as the icon.
const V: [number, number][] = [
  [20, 30],
  [38, 74],
  [52, 42],
  [66, 74],
  [84, 30],
];
const RIB_H = 6.6;
const PAL = ["#eef2ff", "#b9c8ff", "#6c8cff"];

// Each ribbon segment: full-bellied hexagon tapering to near-points — the
// wispiness is geometry + the alpha-fade gradients, never blur.
function taper(a: [number, number], b: [number, number], H: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ux = -dy / L;
  const uy = dx / L;
  const m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const E = Math.max(1.1, H * 0.24);
  return [
    [a[0] + ux * E, a[1] + uy * E],
    [m[0] + ux * H, m[1] + uy * H],
    [b[0] + ux * E, b[1] + uy * E],
    [b[0] - ux * E, b[1] - uy * E],
    [m[0] - ux * H, m[1] - uy * H],
    [a[0] - ux * E, a[1] - uy * E],
  ]
    .map((p) => p.map((v) => v.toFixed(1)).join(","))
    .join(" ");
}
const RIBS = [0, 1, 2, 3].map((i) => taper(V[i], V[i + 1], RIB_H));

// Layout precomputed for SF at 150px (no text measurement in RN): the W tops
// out at the "aft" x-height (~77.5, +3% overshoot for the dissolving tips)
// and shares the baseline at y=170. Nudge these if the device render sits off.
const W_TRANSFORM = "translate(112.1, 35.8) scale(1.814)";
const AFT_X = 270;

interface Wisp {
  id: number;
  d: string;
  width: number;
  progress: Animated.Value;
  peak: number;
}

let wispId = 0;

export function CoalesceWordmark({ width = 230 }: { width?: number }) {
  const gather = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const [wisps, setWisps] = useState<Wisp[]>([]);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function spawnWisp(d: string, width: number, dur: number, peak: number) {
      if (!alive) return;
      const wisp: Wisp = { id: wispId++, d, width, progress: new Animated.Value(0), peak };
      setWisps((w) => [...w, wisp]);
      Animated.timing(wisp.progress, {
        toValue: 1,
        duration: dur,
        easing: Easing.linear,
        useNativeDriver: false, // drives SVG props, not styles
      }).start(() => {
        if (alive) setWisps((w) => w.filter((x) => x.id !== wisp.id));
      });
    }

    function ambientLoop() {
      if (!alive) return;
      const y = 150 + (Math.random() * 60 - 30);
      const x = 40 + Math.random() * 440;
      const dir = Math.random() > 0.5 ? 1 : -1;
      spawnWisp(
        `M${x} ${y} C ${x + dir * 40} ${y - 24}, ${x + dir * 90} ${y + 20}, ${x + dir * 140} ${y - 6}`,
        1.7,
        1600 + Math.random() * 800,
        0.28
      );
      timers.push(setTimeout(ambientLoop, 700 + Math.random() * 1900));
    }

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!alive) return;
      if (reduce) {
        gather.setValue(1);
        setSettled(true);
        return;
      }
      REVEAL_WISPS.forEach((d, i) =>
        timers.push(setTimeout(() => spawnWisp(d, 2.3, 1400, 0.6), i * 90))
      );
      Animated.timing(gather, {
        toValue: 1,
        duration: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        if (!alive) return;
        setSettled(true);
        // Low-amplitude breathe so the settled mark is never frozen.
        Animated.loop(
          Animated.sequence([
            Animated.timing(breathe, {
              toValue: 1,
              duration: 2600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(breathe, {
              toValue: 0,
              duration: 2600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        ).start();
        ambientLoop();
      });
    });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [gather, breathe]);

  const aftOpacity = gather.interpolate({
    inputRange: [0, 0.14, 0.8, 1],
    outputRange: [0, 0, 1, 1],
  });
  // The "gathering": letters drift in from loose spacing to the tight lockup.
  const spacing = gather.interpolate({ inputRange: [0, 1], outputRange: [6, -5] });
  // Ribs fade in staggered, leading the letters like the web reveal.
  const ribOpacity = (i: number) =>
    gather.interpolate({
      inputRange: i === 0 ? [0, 0.55, 1] : [0, i * 0.1, i * 0.1 + 0.55, 1],
      outputRange: i === 0 ? [0, 1, 1] : [0, 0, 1, 1],
    });
  const glowOpacity = settled
    ? breathe.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.34] })
    : gather.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0.5, 0.28] });

  return (
    <View style={{ width, aspectRatio: 600 / 240, alignSelf: "center" }}>
      <Svg width="100%" height="100%" viewBox={VIEWBOX} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="cw-ink" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#eaf0ff" />
            <Stop offset="0.55" stopColor="#b9c8ff" />
            <Stop offset="1" stopColor="#6c8cff" />
          </LinearGradient>
          {[0, 1, 2, 3].map((i) => (
            <LinearGradient
              key={i}
              id={`cw-w-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={V[i][0]}
              y1={V[i][1]}
              x2={V[i + 1][0]}
              y2={V[i + 1][1]}
            >
              {/* Segment 0's dissolving tail (the left flourish) fades in
                  ~30% sooner so it doesn't out-gesture the letterforms. */}
              <Stop offset="0" stopColor={PAL[0]} stopOpacity={i === 0 ? "0.3" : "0.1"} />
              <Stop offset={i === 0 ? "0.17" : "0.24"} stopColor={PAL[0]} stopOpacity="0.92" />
              <Stop offset="0.6" stopColor={PAL[1]} stopOpacity="1" />
              <Stop offset="1" stopColor={PAL[2]} stopOpacity="0.18" />
            </LinearGradient>
          ))}
          <RadialGradient id="cw-glow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#6c8cff" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#6c8cff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <AnimatedEllipse
          cx="300"
          cy="122"
          rx="230"
          ry="86"
          fill="url(#cw-glow)"
          opacity={glowOpacity as unknown as number}
        />
        {wisps.map((w) => (
          <AnimatedPath
            key={w.id}
            d={w.d}
            stroke="url(#cw-ink)"
            strokeWidth={w.width}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${WISP_LEN} ${WISP_LEN}`}
            strokeDashoffset={
              w.progress.interpolate({
                inputRange: [0, 0.625, 1],
                outputRange: [WISP_LEN, 0, 0],
              }) as unknown as number
            }
            opacity={
              w.progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, w.peak, 0],
              }) as unknown as number
            }
          />
        ))}
        <G transform={W_TRANSFORM}>
          {RIBS.map((pts, i) => (
            <AnimatedPolygon
              key={i}
              points={pts}
              fill={`url(#cw-w-${i})`}
              opacity={ribOpacity(i) as unknown as number}
            />
          ))}
        </G>
        <AnimatedSvgText
          x={AFT_X}
          y="170"
          textAnchor="start"
          fontSize="150"
          fontWeight="800"
          letterSpacing={spacing as unknown as number}
          fill="url(#cw-ink)"
          opacity={aftOpacity as unknown as number}
        >
          aft
        </AnimatedSvgText>
      </Svg>
    </View>
  );
}

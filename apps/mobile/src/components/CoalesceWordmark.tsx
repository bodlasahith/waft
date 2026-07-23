import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
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
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
// Animate the reveal by fading a GROUP, not the <Text> itself — react-native-
// svg renders <Text> with animated props (opacity/letterSpacing) unreliably,
// which was dropping "aft" entirely. A plain Text inside an Animated <G> is
// solid.
const AnimatedG = Animated.createAnimatedComponent(G);

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

// ---- Alive ribbon: flutter + laminar flow (RN approximation) ----
const RIP_A = 0.6; // ripple amplitude, local units
const RIP_K = 6.8; // spatial frequency along the stroke
const RIP_W = 2.6; // temporal frequency (rad/s) — sets the keyframe spacing
const SAMPLES = 9;

function ripple(s: number, phase: number, t: number) {
  return RIP_A * Math.sin(RIP_K * s - t * RIP_W + phase) * Math.sin(Math.PI * s);
}

// Smooth-sampled rib path: full-bellied at the middle, tapering to
// near-points at the ends (wispiness from geometry + alpha, never blur),
// displaced perpendicular to the stroke by the ripple.
function ribD(a: [number, number], b: [number, number], H: number, phase: number, t: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const E = Math.max(1.1, H * 0.24);
  const top: string[] = [];
  const bot: string[] = [];
  for (let j = 0; j <= SAMPLES; j++) {
    const s = j / SAMPLES;
    const env = Math.sin(Math.PI * s);
    const w = E + (H - E) * Math.pow(env, 0.85);
    const d = ripple(s, phase, t);
    const px = a[0] + dx * s + nx * d;
    const py = a[1] + dy * s + ny * d;
    top.push(`${(px + nx * w).toFixed(1)} ${(py + ny * w).toFixed(1)}`);
    bot.push(`${(px - nx * w).toFixed(1)} ${(py - ny * w).toFixed(1)}`);
  }
  return `M${top.join(" L")} L${bot.reverse().join(" L")} Z`;
}

// Two flutter keyframes half a ripple period apart; Animated interpolates
// between the path strings (identical structure) for a gentle sway.
const RIB_KEYS = [0, 1, 2, 3].map((i) => [
  ribD(V[i], V[i + 1], RIB_H, i * 1.7, 0),
  ribD(V[i], V[i + 1], RIB_H, i * 1.7, Math.PI / RIP_W),
]);

// Laminar streaks: small motes traversing the W centerline left→right.
// Piecewise-linear interpolation along the vertices, fading at the tips.
const FLOW_N = 5;
const FLOW_FRACS = [0, 0.2882, 0.5, 0.7118, 1]; // cumulative arc-length fractions
const FLOW_X = V.map((p) => p[0]);
const FLOW_Y = V.map((p) => p[1]);

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
  const wobble = useRef(new Animated.Value(0)).current;
  const flowVals = useRef(
    Array.from({ length: FLOW_N }, () => new Animated.Value(0))
  ).current;
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
        // Static settled mark, frozen mid-flutter (phase 0 of the keyframes).
        gather.setValue(1);
        setSettled(true);
        return;
      }
      // The flutter sways between the two ripple keyframes the whole time.
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(wobble, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
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
        // Launch the laminar streaks, staggered so they never clump.
        flowVals.forEach((v, i) => {
          const run = () => {
            if (!alive) return;
            v.setValue(0);
            Animated.timing(v, {
              toValue: 1,
              duration: 3600 + Math.random() * 1800,
              easing: Easing.linear,
              useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished) run();
            });
          };
          timers.push(setTimeout(run, i * 800));
        });
      });
    });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      wobble.stopAnimation();
      flowVals.forEach((v) => v.stopAnimation());
    };
  }, [gather, breathe, wobble, flowVals]);

  const aftOpacity = gather.interpolate({
    inputRange: [0, 0.14, 0.8, 1],
    outputRange: [0, 0, 1, 1],
  });
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
          {RIB_KEYS.map((keys, i) => (
            // Static d — react-native-svg animates path-string interpolation
            // unreliably (it was leaving the ribbon garbled). The reveal still
            // animates via opacity; the flutter is a web-only nicety.
            <AnimatedPath
              key={i}
              d={keys[0]}
              fill={`url(#cw-w-${i})`}
              opacity={ribOpacity(i) as unknown as number}
            />
          ))}
          {flowVals.map((v, i) => (
            <AnimatedCircle
              key={i}
              r={0.9 + (i % 3) * 0.25}
              fill="#eef2ff"
              cx={
                v.interpolate({ inputRange: FLOW_FRACS, outputRange: FLOW_X }) as unknown as number
              }
              cy={
                v.interpolate({ inputRange: FLOW_FRACS, outputRange: FLOW_Y }) as unknown as number
              }
              opacity={
                v.interpolate({
                  inputRange: [0, 0.12, 0.5, 0.88, 1],
                  outputRange: [0, 0.65, 0.45, 0.65, 0],
                }) as unknown as number
              }
            />
          ))}
        </G>
        <AnimatedG opacity={aftOpacity as unknown as number}>
          <SvgText
            x={AFT_X}
            y="170"
            textAnchor="start"
            fontSize="150"
            fontWeight="800"
            fill="url(#cw-ink)"
          >
            aft
          </SvgText>
        </AnimatedG>
      </Svg>
    </View>
  );
}

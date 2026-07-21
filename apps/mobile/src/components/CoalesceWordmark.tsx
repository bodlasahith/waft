import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// The "Coalesce" wordmark (DESIGN.md): the RN approximation of the web
// feTurbulence reveal — the gradient word gathers into place (letter-spacing
// tightens as it fades in over a soft glow) while wispy tendrils draw through,
// then ambient wisps keep drifting by at random short intervals. feTurbulence
// isn't reliable in RN, so this keeps the feel, not the exact smoke.

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// All geometry lives in the same 600x240 space as the web mark.
const VIEWBOX = "0 0 600 240";
const REVEAL_WISPS = [
  "M70 138 C 120 108,150 168,205 138",
  "M320 138 C 370 166,420 108,475 136",
  "M120 178 C 180 193,240 173,300 186",
];
const WISP_LEN = 300;

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

  const wordOpacity = gather.interpolate({ inputRange: [0, 0.66, 1], outputRange: [0, 1, 1] });
  // The "gathering": letters drift in from loose spacing to the tight lockup.
  const spacing = gather.interpolate({ inputRange: [0, 1], outputRange: [6, -5] });
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
        <AnimatedSvgText
          x="300"
          y="170"
          textAnchor="middle"
          fontSize="150"
          fontWeight="800"
          letterSpacing={spacing as unknown as number}
          fill="url(#cw-ink)"
          opacity={wordOpacity as unknown as number}
        >
          waft
        </AnimatedSvgText>
      </Svg>
    </View>
  );
}

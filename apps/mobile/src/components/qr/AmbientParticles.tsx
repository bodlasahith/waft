import React, { useMemo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  SharedValue
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  width: number;
  height: number;
  seed: string;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  opacity: number;
  delay: number;
  speed: number;
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}

const colors = [
  "#A6C8FF",
  "#B58CFF",
  "#6EF3FF",
  "#FFFFFF",
  "#E6F4FF",
];

function hash(str: string) {
  let h = 1779033703;

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return h >>> 0;
}

function random(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function AmbientParticles({
  width,
  height,
  seed,
  tiltX,
  tiltY
}: Props) {

  const particles = useMemo(() => {

    const rand = random(hash(seed));

    return Array.from({ length: 18 }).map(() => ({

      x: rand() * width,

      y: rand() * height,

      r: 1 + rand() * 2.5,

      opacity: 0.05 + rand() * 0.15,

      delay: rand() * 4000,

      speed: 6000 + rand() * 5000,

    }));

  }, [seed, width, height]);

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {particles.map((p, i) => (
        <Particle key={i} {...p} tiltX={tiltX} tiltY={tiltY} />
      ))}
    </Svg>
  );
}

function Particle({
  x,
  y,
  r,
  opacity,
  delay,
  speed,
  tiltX,
  tiltY,
}: Particle) {

  const progress = useSharedValue(0);

  useEffect(() => {

    setTimeout(() => {

      progress.value = withRepeat(

        withTiming(1, {

          duration: speed,

          easing: Easing.inOut(Easing.sin),

        }),

        -1,

        true

      );

    }, delay);

  }, []);

  const animatedProps = useAnimatedProps(() => ({
    cx: x + tiltY.value * 4,
    cy: y + Math.sin(progress.value * Math.PI * 2) * 8 + tiltX.value * 4,
    opacity: opacity + progress.value * 0.05,
  }));

  const index = Math.floor((x / 10) % colors.length);

  return (

    <AnimatedCircle

      animatedProps={animatedProps}

      cx={x}

      r={r}

      fill={colors[index % colors.length]}

    />

  );

}
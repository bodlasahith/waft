import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  width: number;
  color?: string;
}

const PARTICLES = [
  { delay: 0, size: 3 },
  { delay: 350, size: 2.5 },
  { delay: 700, size: 2 },
];

export default function ConnectionParticles({
  width,
  color = "#8AA3FF",
}: Props) {
  return (
    <Svg
      width={width}
      height={20}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {PARTICLES.map((p, i) => (
        <Particle
          key={i}
          width={width}
          delay={p.delay}
          radius={p.size}
          color={color}
        />
      ))}
    </Svg>
  );
}

function Particle({
  width,
  delay,
  radius,
  color,
}: {
  width: number;
  delay: number;
  radius: number;
  color: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 1200,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    cx: radius + progress.value * (width - radius * 2),
    opacity:
      progress.value < 0.15
        ? progress.value / 0.15
        : progress.value > 0.85
        ? (1 - progress.value) / 0.15
        : 1,
  }));

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cy={10}
      r={radius}
      fill={color}
    />
  );
}
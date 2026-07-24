import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  createAnimatedComponent,
} from "react-native-reanimated";

import { useCardMetrics } from "./cardMetrics";

const AnimatedLinearGradient = createAnimatedComponent(LinearGradient);

export function AnimatedGradient() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 18000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    start: {
      x: 0.15 + progress.value * 0.15,
      y: 0.0,
    },
    end: {
      x: 1.0 - progress.value * 0.15,
      y: 1.0,
    },
  }));

  return (
    <AnimatedLinearGradient
      animatedProps={animatedProps}
      colors={[
        "#1B2234",
        "#171F31",
        "#121827",
      ]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
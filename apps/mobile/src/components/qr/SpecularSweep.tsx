import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";

export function SpecularSweep() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      650,
      withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 0.5, 0.5, 0]),
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-220, 260]),
      },
      { rotate: "-18deg" },
    ],
  }));

  return <Animated.View pointerEvents="none" style={[styles.sweep, style]} />;
}

const styles = StyleSheet.create({
  sweep: {
    position: "absolute",
    top: -120,
    width: 90,
    height: 760,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { AnimatedStyle } from "react-native-reanimated";
import { ViewStyle } from "react-native";
import { useCardMetrics } from "./cardMetrics";

// import { useDeviceTilt } from "./useDeviceTilt";

interface Props {
    style?: AnimatedStyle<ViewStyle>;
    color?: string;
}

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);
// const tilt = useDeviceTilt();

export function SpecularHighlight({
    style,
    color
}: Props) {
  const tint = `${color}33`; // subtle translucent tint
  const metrics = useCardMetrics();

  const styles = StyleSheet.create({
    highlight: {
      position: "absolute",

      width: 180,

      height: 900,

      top: -180,

      left: -150,

      opacity: 0.9,

      borderRadius: metrics.borderRadius,
    },
  });

  return (
    <AnimatedGradient
      pointerEvents="none"
      colors={[
        "rgba(255,255,255,0)",
        "rgba(255,255,255,.045)",
        tint,
        "rgba(255,255,255,.045)",
        "rgba(255,255,255,0)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.highlight, style]}
    />
  );
}
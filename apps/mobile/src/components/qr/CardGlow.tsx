import { StyleSheet, ViewStyle } from "react-native";
import Animated, { AnimatedStyle } from "react-native-reanimated";

import { useCardMetrics } from "./cardMetrics";

interface Props {
  color: string;
  style?: AnimatedStyle<ViewStyle>;
}

export function CardGlow({ color, style }: Props) {
  const metrics = useCardMetrics();

  const styles = StyleSheet.create({
    glow: {
      position: "absolute",

      width: metrics.glowSize,

      height: metrics.glowSize,

      borderRadius: 170,

      alignSelf: "center",

      top: 90,

      opacity: 0.2,

      zIndex: -1,
    },
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          backgroundColor: `${color}22`,
        },
        style,
      ]}
    />
  );
}
import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  interpolate,
  useAnimatedStyle,
  SharedValue
} from "react-native-reanimated";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface Props {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}

export function HolographicOverlay({
  tiltX,
  tiltY,
}: Props) {

  const style = useAnimatedStyle(() => {

    // magnitude of tilt

    const amount = Math.min(
      Math.abs(tiltX.value) + Math.abs(tiltY.value),
      30
    );

    const opacity = interpolate(
      amount,
      [0, 8, 20],
      [0.02, 0.08, 0.18]
    );

    const translateX = interpolate(
      tiltY.value,
      [-20, 20],
      [-25, 25]
    );

    const translateY = interpolate(
      tiltX.value,
      [-20, 20],
      [-20, 20]
    );

    const rotate = `${tiltY.value * 0.8}deg`;

    return {

      opacity,

      transform: [

        { translateX },

        { translateY },

        { rotate },

        { scale: 1.15 },

      ],

    };

  });

  return (

    <AnimatedGradient

      pointerEvents="none"

      colors={[

        "transparent",

        "rgba(120,255,255,0.18)",

        "rgba(180,120,255,0.22)",

        "rgba(255,120,220,0.18)",

        "transparent",

      ]}

      start={{
        x: 0,
        y: 0,
      }}

      end={{
        x: 1,
        y: 1,
      }}

      style={[
        StyleSheet.absoluteFill,
        style,
      ]}

    />

  );

}
import { useEffect } from "react";

import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useDeviceTilt } from "./useDeviceTilt";
import { useCardMotion } from "./useCardMotion";

export function useCardAnimation() {
  const entrance = useSharedValue(0);
  const breathe = useSharedValue(0);
  const tilt = useDeviceTilt();
  const motion = useCardMotion();

  useEffect(() => {
    entrance.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });

    breathe.value = withRepeat(
      withTiming(1, {
        duration: 4200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,

    transform: [
      {
        translateY: (1 - entrance.value) * 24,
      },
      {
        scale: 0.96 + entrance.value * 0.04,
      },
    ],
  }));

  const cardMaterialStyle = useAnimatedStyle(() => ({
    transform: [
      {
        perspective: 1200,
      },
      {
        rotateX: `${motion.tiltX.value}deg`,
      },
      {
        rotateY: `${motion.tiltY.value}deg`,
      },
    ],
  }));

  const qrStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: 1 + breathe.value * 0.008,
      },
    ],
  }));

  const graphStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: motion.tiltY.value * 2,
      },
      {
        translateY: motion.tiltX.value * 2,
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + breathe.value * 0.08,

    transform: [
      {
        scale: 1.18 + breathe.value * 0.05,
      },
      {
        translateX: motion.tiltY.value * 4,
      },
      {
        translateY: motion.tiltX.value * 4,
      },
    ],
  }));

  const specularStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: motion.tiltY.value * 18,
      },
      {
        translateY: motion.tiltX.value * 8,
      },
      {
        rotate: "-22deg",
      },
    ],
  }));

  return {
    cardStyle,
    cardMaterialStyle,
    qrStyle,
    glowStyle,
    graphStyle,
    specularStyle,
  };
}
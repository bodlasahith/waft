import { useEffect } from "react";
import { Platform } from "react-native";

import * as Device from "expo-device";
import { Gyroscope } from "expo-sensors";

import {
  Easing,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export function useCardMotion() {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    //
    // Simulator / Emulator
    //
    if (!Device.isDevice) {
      tiltX.value = withRepeat(
        withTiming(3, {
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );

      tiltY.value = withRepeat(
        withTiming(-2.5, {
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );

      return;
    }

    //
    // Real Device
    //

    Gyroscope.setUpdateInterval(16);

    let accumulatedX = 0;
    let accumulatedY = 0;

    const subscription = Gyroscope.addListener(({ x, y }) => {
      accumulatedX += y * 0.3;
      accumulatedY += x * 0.3;

      accumulatedX = Math.max(-5, Math.min(5, accumulatedX));
      accumulatedY = Math.max(-5, Math.min(5, accumulatedY));

      tiltX.value = withSpring(accumulatedX, {
        damping: 18,
        stiffness: 150,
      });

      tiltY.value = withSpring(accumulatedY, {
        damping: 18,
        stiffness: 150,
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    tiltX,
    tiltY,
  };
}
import { useEffect } from "react";
import { Accelerometer } from "expo-sensors";
import {
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function useDeviceTilt() {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(16);

    const sub = Accelerometer.addListener(({ x, y }) => {
      // Clamp to keep movement subtle
      const max = 8;

      tiltX.value = withSpring(
        Math.max(-max, Math.min(max, y * max)),
        {
          damping: 18,
          stiffness: 140,
        }
      );

      tiltY.value = withSpring(
        Math.max(-max, Math.min(max, -x * max)),
        {
          damping: 18,
          stiffness: 140,
        }
      );
    });

    return () => sub.remove();
  }, []);

  return {
    tiltX,
    tiltY,
  };
}
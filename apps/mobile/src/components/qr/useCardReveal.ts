import { useEffect } from 'react';
import {
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function useCardReveal() {
  const header = useSharedValue(0);
  const qr = useSharedValue(0);
  const description = useSharedValue(0);
  const footer = useSharedValue(0);

  useEffect(() => {
    header.value = withDelay(
      120,
      withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      })
    );

    qr.value = withDelay(
      240,
      withTiming(1, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      })
    );

    description.value = withDelay(
      380,
      withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      })
    );

    footer.value = withDelay(
      520,
      withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, []);

  return { header, qr, description, footer };
}
import React from 'react';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

interface Props {
  progress: SharedValue<number>;
  children: React.ReactNode;
}

export function AnimatedSection({ progress, children }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [24, 0]),
      },
      {
        scale: interpolate(progress.value, [0, 1], [0.96, 1]),
      },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
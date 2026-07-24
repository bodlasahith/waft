import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

interface Props {
  progress: SharedValue<number>;
  children: React.ReactNode;
}

export function FloatingQRTile({ progress, children }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [26, 0]),
      },
      {
        scale: interpolate(progress.value, [0, 0.85, 1], [0.9, 1.04, 1]),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <View style={styles.innerHighlight} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    padding: 18,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",

    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,

    overflow: "hidden",
  },
  innerHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});
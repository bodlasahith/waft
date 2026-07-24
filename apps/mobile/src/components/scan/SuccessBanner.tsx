import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from "react-native-reanimated";

interface Props {
  alreadyConnected?: boolean;
}

export default function SuccessBanner({
  alreadyConnected = false,
}: Props) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      950,
      withSpring(1, {
        damping: 12,
        stiffness: 160,
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [
      {
        scale: scale.value,
      },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Text style={styles.check}>✓</Text>

      <Text style={styles.title}>
        {alreadyConnected ? "Already Connected" : "Connected"}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  check: {
    fontSize: 56,
    color: "#6E7DFF",
    textAlign: "center",
    fontWeight: "700",
  },

  title: {
    color: "white",
    fontWeight: "700",
    fontSize: 28,
    textAlign: "center",
    marginTop: 8,
  },
});
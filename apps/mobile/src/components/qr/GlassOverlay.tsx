import { View, StyleSheet } from "react-native";
import { useCardMetrics } from "./cardMetrics";

export function GlassOverlay() {
  const metrics = useCardMetrics();

  const styles = StyleSheet.create({
    topHighlight: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 2,
      backgroundColor: "rgba(255,255,255,.15)",
    },

    leftGlow: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: metrics.borderRadius,

      top: -80,
      left: -40,

      backgroundColor: "rgba(255,255,255,.03)",
    },

    rightGlow: {
      position: "absolute",

      width: 220,

      height: 220,

      borderRadius: metrics.borderRadius,

      right: -70,

      bottom: -70,

      backgroundColor: "rgba(255,255,255,.025)",
    },

    bottomShade: {
      position: "absolute",

      left: 0,

      right: 0,

      bottom: 0,

      height: 70,

      backgroundColor: "rgba(0,0,0,.06)",
    },
  });

  return (
    <>
      <View pointerEvents="none" style={styles.topHighlight} />

      <View pointerEvents="none" style={styles.leftGlow} />

      <View pointerEvents="none" style={styles.rightGlow} />

      <View pointerEvents="none" style={styles.bottomShade} />
    </>
  );
}
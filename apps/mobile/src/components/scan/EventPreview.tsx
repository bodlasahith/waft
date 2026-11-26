import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface Props {
  visible: boolean;
  eventName: string;
  location?: string | null;
  icebreaker?: string;
  onDone: () => void;
}

/** Bottom sheet confirming an event check-in; the next scans are tagged with this event. */
export default function EventPreview({ visible, eventName, location, icebreaker, onDone }: Props) {
  const translate = useSharedValue(120);

  useEffect(() => {
    if (!visible) return;
    translate.value = 120;
    translate.value = withSpring(0, { damping: 14, stiffness: 170 });
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
    opacity: 1 - translate.value / 120,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.sheet, style]}>
      <View style={styles.handle} />
      <Text style={styles.kicker}>You're checked in</Text>
      <Text style={styles.name}>{eventName}</Text>
      {location ? <Text style={styles.subtitle}>{location}</Text> : null}
      <Text style={styles.hint}>
        Everyone you scan now shows up on the event's live wall.
      </Text>
      {icebreaker ? (
        <View style={styles.icebreaker}>
          <Text style={styles.icebreakerLabel}>Conversation starter</Text>
          <Text style={styles.icebreakerText}>{icebreaker}</Text>
        </View>
      ) : null}
      <Pressable style={styles.primary} onPress={onDone}>
        <Text style={styles.primaryText}>Start scanning people</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 30,
    borderRadius: 28,
    backgroundColor: "rgba(18,24,38,.96)",
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,.15)",
    marginBottom: 18,
  },
  kicker: {
    color: "#7E91FF",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: { color: "white", fontWeight: "700", fontSize: 24, marginTop: 8, textAlign: "center" },
  subtitle: { color: "#A7B3D1", marginTop: 6, textAlign: "center" },
  hint: { color: "#A7B3D1", marginTop: 14, textAlign: "center", lineHeight: 20 },
  icebreaker: {
    marginTop: 18,
    width: "100%",
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.04)",
  },
  icebreakerLabel: {
    color: "#7E91FF",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  icebreakerText: { color: "white", marginTop: 10, lineHeight: 24, fontSize: 16 },
  primary: {
    marginTop: 22,
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#6E7DFF",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryText: { color: "white", fontWeight: "700", fontSize: 16 },
});

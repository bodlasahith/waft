import React, { useEffect } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import Svg from "react-native-svg";
import { AvatarNode } from "../AvatarNode";
import { DEFAULT_BADGE, PLATFORM_BADGES, platformName, socialHref } from "../../socials";

interface Social {
  platform: string;
  handle: string;
  url?: string;
}

interface Props {
  visible: boolean;
  profile: {
    name: string;
    avatar?: { color?: string; shape?: string } | null;
    socials: Social[];
  };
  /** Line under the name, e.g. "Connected at YC Demo Day" or "Already connected". */
  subtitle?: string;
  icebreaker?: string;
  onDone: () => void;
  doneLabel?: string;
  /** Delay before the sheet slides in, so it lands after the connection animation. */
  delayMs?: number;
}

/**
 * Bottom sheet shown after a successful scan: who you just met, their socials
 * (tap to open the native app / profile), and the AI icebreaker.
 */
export default function ProfilePreview({
  visible,
  profile,
  subtitle,
  icebreaker,
  onDone,
  doneLabel = "Scan next",
  delayMs = 1400,
}: Props) {
  const translate = useSharedValue(120);

  useEffect(() => {
    if (!visible) return;
    translate.value = 120;
    translate.value = withDelay(delayMs, withSpring(0, { damping: 14, stiffness: 170 }));
  }, [visible, delayMs]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
    opacity: 1 - translate.value / 120,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.sheet, style]}>
      <View style={styles.handle} />
      <Svg width={70} height={70}>
        <AvatarNode
          x={35}
          y={35}
          r={26}
          color={profile.avatar?.color ?? "#6E7DFF"}
          shape={profile.avatar?.shape}
          initial={profile.name.charAt(0)}
        />
      </Svg>
      <Text style={styles.name}>{profile.name}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {profile.socials.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.socials}
          style={styles.socialsScroll}
        >
          {profile.socials.map((s) => {
            const badge = PLATFORM_BADGES[s.platform] ?? DEFAULT_BADGE;
            const href = socialHref(s.platform, s.handle, s.url);
            return (
              <Pressable
                key={s.platform}
                disabled={!href}
                onPress={() => href && Linking.openURL(href)}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                accessibilityRole={href ? "link" : "text"}
                accessibilityLabel={`${platformName(s.platform)}: ${s.handle}`}
              >
                <View style={[styles.chipBadge, { backgroundColor: badge.color }]}>
                  <Text style={[styles.chipGlyph, badge.dark && { color: "#222" }]}>
                    {badge.glyph}
                  </Text>
                </View>
                <Text style={styles.chipText} numberOfLines={1}>
                  {s.handle}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.noSocials}>No socials shared yet.</Text>
      )}

      {icebreaker ? (
        <View style={styles.icebreaker}>
          <Text style={styles.icebreakerLabel}>Conversation starter</Text>
          <Text style={styles.icebreakerText}>{icebreaker}</Text>
        </View>
      ) : null}

      <Pressable style={styles.primary} onPress={onDone}>
        <Text style={styles.primaryText}>{doneLabel}</Text>
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
  name: { color: "white", fontWeight: "700", fontSize: 24, marginTop: 12 },
  subtitle: { color: "#A7B3D1", marginTop: 6, textAlign: "center" },
  socialsScroll: { marginTop: 18, alignSelf: "stretch", flexGrow: 0 },
  socials: { gap: 8, paddingHorizontal: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.06)",
    maxWidth: 220,
  },
  chipPressed: { backgroundColor: "rgba(255,255,255,.14)" },
  chipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipGlyph: { color: "white", fontWeight: "700", fontSize: 12 },
  chipText: { color: "white", fontWeight: "600", flexShrink: 1 },
  noSocials: { color: "#A7B3D1", marginTop: 16 },
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

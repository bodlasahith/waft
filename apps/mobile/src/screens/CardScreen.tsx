import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";
import QRCode from "react-native-qrcode-svg";
import Svg from "react-native-svg";
import { api, MyProfile } from "../api";
import { CARD_ORIGIN } from "../config";
import { AvatarNode } from "../components/AvatarNode";
import { EditSocialsScreen } from "./EditSocialsScreen";
import { AvatarPickerScreen } from "./AvatarPickerScreen";

export function CardScreen() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);

  const load = useCallback(() => {
    api
      .me()
      .then((p) => {
        setProfile(p);
        setError(null);
      })
      .catch((e) =>
        setError(e.status === 401 ? "Sign in to get your Waft card." : "Couldn't load your card.")
      );
  }, []);

  useEffect(load, [load]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (editing) {
    return (
      <EditSocialsScreen
        socials={profile.social_links}
        onChanged={load}
        onClose={() => setEditing(false)}
      />
    );
  }

  if (pickingAvatar) {
    return (
      <AvatarPickerScreen
        current={profile.avatar}
        initial={profile.name.charAt(0).toUpperCase()}
        onDone={() => {
          setPickingAvatar(false);
          load();
        }}
      />
    );
  }

  return (
    <View style={styles.center}>
      <CardEntrance>
      <Pressable onPress={() => setPickingAvatar(true)} style={styles.avatarRow}>
        <Svg width={44} height={44}>
          <AvatarNode
            x={22}
            y={22}
            r={16}
            color={profile.avatar?.color ?? "#4a7dff"}
            shape={profile.avatar?.shape}
            initial={profile.name.charAt(0).toUpperCase()}
          />
        </Svg>
        <Text style={styles.name}>{profile.name}</Text>
      </Pressable>
      <View style={styles.qrWrap}>
        <QRCode value={`${CARD_ORIGIN}/c/${profile.card_code}`} size={240} />
      </View>
      <Text style={styles.muted}>Have someone scan this to connect</Text>
      <Pressable onPress={() => setEditing(true)}>
        <Text style={styles.editLink}>
          {profile.social_links.length} social{profile.social_links.length === 1 ? "" : "s"} linked — edit
        </Text>
      </Pressable>
      <Pressable onPress={() => setPickingAvatar(true)}>
        <Text style={styles.editLink}>Customize your node</Text>
      </Pressable>
      </CardEntrance>
    </View>
  );
}

/** Springs the card in on mount — subtle, but the first thing you see. */
function CardEntrance({ children }: { children: ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 7, useNativeDriver: true }).start();
  }, [anim]);
  return (
    <Animated.View
      style={{
        alignItems: "center",
        gap: 16,
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  qrWrap: {
    padding: 18,
    backgroundColor: colors.qrTile,
    borderRadius: radii.lg,
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  muted: { color: colors.textMuted, textAlign: "center" },
  editLink: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});

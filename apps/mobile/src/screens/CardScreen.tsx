import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { api, MyProfile } from "../api";
import { CARD_ORIGIN } from "../config";
import { EditSocialsScreen } from "./EditSocialsScreen";

export function CardScreen() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

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

  return (
    <View style={styles.center}>
      <Text style={styles.name}>{profile.name}</Text>
      <View style={styles.qrWrap}>
        <QRCode value={`${CARD_ORIGIN}/c/${profile.card_code}`} size={240} />
      </View>
      <Text style={styles.muted}>Have someone scan this to connect</Text>
      <Pressable onPress={() => setEditing(true)}>
        <Text style={styles.editLink}>
          {profile.social_links.length} social{profile.social_links.length === 1 ? "" : "s"} linked — edit
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  name: { fontSize: 24, fontWeight: "700" },
  qrWrap: { padding: 16, backgroundColor: "#fff", borderRadius: 16 },
  muted: { color: "#888", textAlign: "center" },
  editLink: { color: "#4a7dff", fontSize: 14, fontWeight: "500" },
});

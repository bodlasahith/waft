import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api, MyProfile } from "../api";

import { EditSocialsScreen } from "./EditSocialsScreen";
import { AvatarPickerScreen } from "./AvatarPickerScreen";


import { QRCard } from "../components/qr/QRCard";

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
        setError(
          e.status === 401
            ? "Sign in to get your Waft card."
            : "Couldn't load your Waft card."
        )
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
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
    <View style={styles.container}>
      <QRCard
        profile={profile}
        onEditAvatar={() => setPickingAvatar(true)}
        onEditSocials={() => setEditing(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  center: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    padding: 24,
  },

  error: {
    textAlign: "center",
    color: "#9CA3AF",
  },
});
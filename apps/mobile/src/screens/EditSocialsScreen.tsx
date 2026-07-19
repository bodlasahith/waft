import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PLATFORMS, Platform } from "@waft/shared";
import { api } from "../api";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  github: "GitHub",
  x: "X",
  discord: "Discord",
  spotify: "Spotify",
  tiktok: "TikTok",
  reddit: "Reddit",
  snapchat: "Snapchat",
  facebook: "Facebook",
  telegram: "Telegram",
  slack: "Slack",
  phone: "Phone",
};

interface Props {
  socials: { platform: string; handle: string }[];
  onChanged: () => void;
  onClose: () => void;
}

/**
 * Add/remove the links behind your card. Adding is two taps: pick a
 * platform chip, type the handle. Everything saves immediately.
 */
export function EditSocialsScreen({ socials, onChanged, onClose }: Props) {
  const [adding, setAdding] = useState<Platform | null>(null);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linked = new Map(socials.map((s) => [s.platform, s.handle]));
  const unlinked = PLATFORMS.filter((p) => !linked.has(p));

  async function add() {
    if (!adding) return;
    setBusy(true);
    setError(null);
    try {
      // Handles are pasted messily — strip the @ people habitually include.
      await api.addSocial(adding, handle.trim().replace(/^@/, ""));
      setAdding(null);
      setHandle("");
      onChanged();
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(platform: string) {
    setBusy(true);
    setError(null);
    try {
      await api.removeSocial(platform);
      onChanged();
    } catch {
      setError("Couldn't remove — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your links</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      {socials.length === 0 && (
        <Text style={styles.muted}>Nothing linked yet — add your first below.</Text>
      )}
      {socials.map((s) => (
        <View key={s.platform} style={styles.row}>
          <View>
            <Text style={styles.platform}>{PLATFORM_LABELS[s.platform as Platform] ?? s.platform}</Text>
            <Text style={styles.handle}>{s.handle}</Text>
          </View>
          <Pressable onPress={() => remove(s.platform)} disabled={busy}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {adding ? (
        <View style={styles.addBox}>
          <Text style={styles.platform}>{PLATFORM_LABELS[adding]}</Text>
          <TextInput
            style={styles.input}
            placeholder={adding === "phone" ? "+1 555 123 4567" : "your handle"}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            keyboardType={adding === "phone" ? "phone-pad" : "default"}
            value={handle}
            onChangeText={setHandle}
          />
          <View style={styles.addActions}>
            <Button title="Add" onPress={add} disabled={busy || handle.trim().length === 0} />
            <Pressable onPress={() => { setAdding(null); setHandle(""); }}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        unlinked.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Add a link</Text>
            <View style={styles.chips}>
              {unlinked.map((p) => (
                <Pressable key={p} style={styles.chip} onPress={() => setAdding(p)}>
                  <Text style={styles.chipText}>{PLATFORM_LABELS[p]}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )
      )}

      {busy && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  done: { color: "#4a7dff", fontSize: 16, fontWeight: "600" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  platform: { fontWeight: "600", fontSize: 15 },
  handle: { color: "#666", fontSize: 13, marginTop: 2 },
  remove: { color: "#c00", fontSize: 13 },
  sectionLabel: { color: "#888", marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 13 },
  addBox: { backgroundColor: "#fff", borderRadius: 12, padding: 14, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  addActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  cancel: { color: "#888" },
  muted: { color: "#888", textAlign: "center", marginVertical: 8 },
  spinner: { marginTop: 4 },
  error: { color: "#c00", textAlign: "center" },
});

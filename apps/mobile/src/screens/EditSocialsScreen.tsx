import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
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
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            keyboardType={adding === "phone" ? "phone-pad" : "default"}
            value={handle}
            onChangeText={setHandle}
          />
          <View style={styles.addActions}>
            <AppButton title="Add" onPress={add} disabled={handle.trim().length === 0} busy={busy} />
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
  title: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  done: { color: colors.accent, fontSize: 16, fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 15,
  },
  platform: { fontWeight: "700", fontSize: 15, color: colors.text },
  handle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  remove: { color: colors.danger, fontSize: 13 },
  sectionLabel: { color: colors.textFaint, marginTop: 8, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  addBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 15,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: 12,
    fontSize: 15,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
  },
  addActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  cancel: { color: colors.textMuted },
  muted: { color: colors.textMuted, textAlign: "center", marginVertical: 8 },
  spinner: { marginTop: 4 },
  error: { color: colors.danger, textAlign: "center" },
});

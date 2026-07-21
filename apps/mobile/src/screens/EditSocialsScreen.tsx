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

type Visibility = "public" | "mutual_only" | "event_only";
const VIS_OPTIONS: { value: Visibility; label: string; blurb: string }[] = [
  { value: "public", label: "Public", blurb: "Anyone who scans your card" },
  { value: "mutual_only", label: "Connections", blurb: "Only people you've connected with" },
  { value: "event_only", label: "Event only", blurb: "Only people from the same event" },
];
const VIS_LABEL: Record<string, string> = {
  public: "Public",
  mutual_only: "Connections",
  event_only: "Event only",
};

interface Props {
  socials: { platform: string; handle: string; visibility?: string }[];
  onChanged: () => void;
  onClose: () => void;
}

/**
 * Add/remove/edit the links behind your card, each with a visibility:
 * public (on your scannable card), connections-only, or event-only.
 */
export function EditSocialsScreen({ socials, onChanged, onClose }: Props) {
  const [adding, setAdding] = useState<Platform | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linked = new Map(socials.map((s) => [s.platform, s.handle]));
  const unlinked = PLATFORMS.filter((p) => !linked.has(p));

  // Adding a social upserts by platform, so saving an edit is the same call
  // with the same platform, the (possibly new) handle, and visibility.
  async function save(platform: Platform) {
    setBusy(true);
    setError(null);
    try {
      // Handles are pasted messily — strip the @ people habitually include.
      await api.addSocial(platform, handle.trim().replace(/^@/, ""), undefined, visibility);
      setAdding(null);
      setEditing(null);
      setHandle("");
      onChanged();
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  function startAdd(platform: Platform) {
    setEditing(null);
    setHandle("");
    setVisibility("public");
    setAdding(platform);
  }

  function startEdit(platform: string, current: string, currentVis?: string) {
    setAdding(null);
    setEditing(platform);
    setHandle(current);
    setVisibility((currentVis as Visibility) ?? "public");
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
      {socials.map((s) =>
        editing === s.platform ? (
          <View key={s.platform} style={styles.addBox}>
            <Text style={styles.platform}>{PLATFORM_LABELS[s.platform as Platform] ?? s.platform}</Text>
            <TextInput
              style={styles.input}
              placeholder={s.platform === "phone" ? "+1 555 123 4567" : "your handle"}
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              keyboardType={s.platform === "phone" ? "phone-pad" : "default"}
              value={handle}
              onChangeText={setHandle}
            />
            <VisibilityPicker value={visibility} onChange={setVisibility} />
            <View style={styles.addActions}>
              <AppButton
                title="Save"
                onPress={() => save(s.platform as Platform)}
                disabled={handle.trim().length === 0}
                busy={busy}
              />
              <Pressable onPress={() => { setEditing(null); setHandle(""); }}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View key={s.platform} style={styles.row}>
            <View>
              <Text style={styles.platform}>{PLATFORM_LABELS[s.platform as Platform] ?? s.platform}</Text>
              <Text style={styles.handle}>
                {s.handle}
                {s.visibility && s.visibility !== "public" ? `  ·  ${VIS_LABEL[s.visibility]}` : ""}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Pressable onPress={() => startEdit(s.platform, s.handle, s.visibility)} disabled={busy}>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => remove(s.platform)} disabled={busy}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )
      )}

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
          <VisibilityPicker value={visibility} onChange={setVisibility} />
          <View style={styles.addActions}>
            <AppButton title="Add" onPress={() => save(adding)} disabled={handle.trim().length === 0} busy={busy} />
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
                <Pressable key={p} style={styles.chip} onPress={() => startAdd(p)}>
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

function VisibilityPicker({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  return (
    <View style={styles.visWrap}>
      <Text style={styles.visLabel}>Who can see this</Text>
      <View style={styles.visRow}>
        {VIS_OPTIONS.map((o) => {
          const active = value === o.value;
          return (
            <Pressable
              key={o.value}
              style={[styles.visChip, active && styles.visChipActive]}
              onPress={() => onChange(o.value)}
            >
              <Text style={[styles.visChipText, active && styles.visChipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.visBlurb}>{VIS_OPTIONS.find((o) => o.value === value)?.blurb}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  visWrap: { gap: 6 },
  visLabel: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  visRow: { flexDirection: "row", gap: 6 },
  visChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
  },
  visChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  visChipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  visChipTextActive: { color: colors.accent },
  visBlurb: { color: colors.textMuted, fontSize: 11 },
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
  rowActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  edit: { color: colors.accent, fontSize: 13, fontWeight: "600" },
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

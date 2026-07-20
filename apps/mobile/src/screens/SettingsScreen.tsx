import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
import { supabase } from "../supabase";
import { getHasPassword, markHasPassword } from "../passwordFlag";

/** Account settings: set/change a password, sign out. */
export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHasPassword().then(setHasPassword);
  }, []);

  async function savePassword() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (pwErr) {
      setError(pwErr.message);
      return;
    }
    await markHasPassword();
    setHasPassword(true);
    setPassword("");
    setSaved(true);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{hasPassword ? "Change password" : "Set a password"}</Text>
        <Text style={styles.sectionHint}>
          {hasPassword
            ? "Update the password you use to sign in."
            : "Add a password to sign in faster next time — no code or Google needed. You can still use those too."}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={hasPassword ? "New password" : "Password (min 6 characters)"}
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setSaved(false);
          }}
        />
        <AppButton
          title={hasPassword ? "Update password" : "Set password"}
          onPress={savePassword}
          disabled={password.length < 6}
          busy={busy}
        />
        {saved && <Text style={styles.saved}>Saved — you can now sign in with your password.</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  done: { color: colors.accent, fontSize: 16, fontWeight: "700" },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  sectionHint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: 13,
    fontSize: 15,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
  },
  saved: { color: colors.success, fontSize: 13, textAlign: "center" },
  error: { color: colors.danger, fontSize: 13, textAlign: "center" },
  signOut: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  signOutText: { color: colors.textMuted, fontWeight: "600" },
});

import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
import { api } from "../api";
import { supabase } from "../supabase";
import { markHasPassword } from "../passwordFlag";

/**
 * Shown once after first sign-in, when no profile row exists yet.
 * Name is required; a password is optional (skip = leave it blank, set it
 * later in Settings). Everything else is added progressively. The
 * "20-second signup".
 */
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.register(name.trim());
      // Optional: set a password now for faster future sign-ins.
      if (password.length >= 6) {
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (!pwErr) await markHasPassword();
      }
      onDone();
    } catch {
      setError("Couldn't create your profile — is the API running?");
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What should people call you?</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor={colors.textFaint}
        autoFocus
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.optionalLabel}>Set a password (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="For faster sign-in later"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={styles.hint}>
        Skip and you can add one anytime in Settings — you&apos;ll still sign in with a code or
        Google.
        {password.length > 0 && password.length < 6 ? " (at least 6 characters)" : ""}
      </Text>

      <AppButton
        title="Get my Waft card"
        onPress={submit}
        disabled={name.trim().length === 0 || (password.length > 0 && password.length < 6)}
        busy={busy}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, gap: 16 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 15,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  optionalLabel: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  hint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, textAlign: "center" },
});

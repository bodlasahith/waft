import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
import { api } from "../api";

/**
 * Shown once after first sign-in, when no profile row exists yet.
 * One field, one tap — everything else (socials, photo) is added
 * progressively later. This is the "20-second signup".
 */
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.register(name.trim());
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
      <AppButton
        title="Get my Waft card"
        onPress={submit}
        disabled={name.trim().length === 0}
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
  error: { color: colors.danger, textAlign: "center" },
});

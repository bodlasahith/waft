import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
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
        autoFocus
        value={name}
        onChangeText={setName}
      />
      <Button
        title="Get my Waft card"
        onPress={submit}
        disabled={busy || name.trim().length === 0}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, gap: 16 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  error: { color: "#c00", textAlign: "center" },
});

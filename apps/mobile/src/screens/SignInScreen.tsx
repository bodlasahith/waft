import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../supabase";

WebBrowser.maybeCompleteAuthSession();

type Step = "email" | "code";

export function SignInScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError("Wrong or expired code — try again.");
    // On success onAuthStateChange in App.tsx takes over.
  }

  async function signInWithProvider(provider: "google" | "apple") {
    setBusy(true);
    setError(null);
    try {
      const redirectTo = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success") {
        const code = new URL(result.url).searchParams.get("code");
        if (!code) throw new Error("No auth code in redirect");
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      }
    } catch (e: any) {
      setError(e.message ?? "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Waft</Text>
      <Text style={styles.tagline}>Scan once. Connect everywhere.</Text>

      {step === "email" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            title="Send sign-in code"
            onPress={sendCode}
            disabled={busy || !email.includes("@")}
          />
        </>
      ) : (
        <>
          <Text style={styles.muted}>We emailed a sign-in code to {email.trim()}</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChangeText={setCode}
          />
          <Button title="Verify" onPress={verifyCode} disabled={busy || code.length < 6} />
          <Pressable onPress={() => setStep("email")}>
            <Text style={styles.link}>Use a different email</Text>
          </Pressable>
        </>
      )}

      <View style={styles.divider} />
      <Button title="Continue with Google" onPress={() => signInWithProvider("google")} disabled={busy} />

      {busy && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, gap: 12 },
  logo: { fontSize: 40, fontWeight: "800", textAlign: "center" },
  tagline: { color: "#888", textAlign: "center", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 16 },
  muted: { color: "#888", textAlign: "center" },
  link: { color: "#4a7dff", textAlign: "center", paddingVertical: 8 },
  spinner: { marginTop: 8 },
  error: { color: "#c00", textAlign: "center" },
});

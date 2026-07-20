import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
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
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          // Always show Google's account chooser — the auth browser shares
          // Safari cookies, so without this it silently reuses the last account.
          queryParams: { prompt: "select_account" },
        },
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
      <Text style={styles.logo}>waft<Text style={{ color: colors.accent }}>.</Text></Text>
      <Text style={styles.tagline}>Scan once. Connect everywhere.</Text>

      {step === "email" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AppButton
            title="Send sign-in code"
            onPress={sendCode}
            disabled={!email.includes("@")}
            busy={busy}
          />
        </>
      ) : (
        <>
          <Text style={styles.muted}>We emailed a sign-in code to {email.trim()}</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChangeText={setCode}
          />
          <AppButton title="Verify" onPress={verifyCode} disabled={code.length < 6} busy={busy} />
          <Pressable onPress={() => setStep("email")}>
            <Text style={styles.link}>Use a different email</Text>
          </Pressable>
        </>
      )}

      <View style={styles.divider} />
      <AppButton
        title="Continue with Google"
        variant="ghost"
        onPress={() => signInWithProvider("google")}
        disabled={busy}
      />

      {busy && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 32, gap: 12 },
  logo: {
    fontSize: 52,
    fontWeight: "800",
    textAlign: "center",
    color: colors.text,
    letterSpacing: -1.5,
  },
  tagline: { color: colors.textMuted, textAlign: "center", marginBottom: 28, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 15,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  muted: { color: colors.textMuted, textAlign: "center" },
  link: { color: colors.accent, textAlign: "center", paddingVertical: 8 },
  spinner: { marginTop: 8 },
  error: { color: colors.danger, textAlign: "center" },
});

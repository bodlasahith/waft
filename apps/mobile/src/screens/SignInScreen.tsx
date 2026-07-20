import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
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

  // Fallback capture: if the auth browser doesn't self-close on the
  // waft:// redirect (simulator quirk), iOS routes the deep link to the
  // app — complete the exchange from here and dismiss the browser.
  useEffect(() => {
    async function handleUrl(url: string) {
      if (!url.startsWith("waft://")) return;
      const authCode = new URL(url).searchParams.get("code");
      console.log("[oauth] deep-link fallback:", url.slice(0, 60), "code:", !!authCode);
      if (!authCode) return;
      WebBrowser.dismissAuthSession();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (exchangeError) console.log("[oauth] fallback exchange error:", exchangeError.message);
    }
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    return () => sub.remove();
  }, []);

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
      // Pin the exact redirect that's allow-listed and historically proven;
      // bare makeRedirectUri() can vary by build type.
      const redirectTo = makeRedirectUri({ native: "waft://" });
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

      console.log("[oauth] redirectTo:", redirectTo);
      console.log("[oauth] authorize url:", data.url.slice(0, 140));
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log("[oauth] browser result:", result.type, "url" in result ? result.url : "");
      if (result.type === "success") {
        const code = new URL(result.url).searchParams.get("code");
        console.log("[oauth] extracted code:", code ? code.slice(0, 8) + "…" : "NONE");
        if (!code) throw new Error("No auth code in redirect");
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) console.log("[oauth] exchange error:", exchangeError.message);
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

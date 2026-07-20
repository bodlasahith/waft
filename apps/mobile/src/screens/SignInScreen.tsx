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
import { getHasPassword } from "../passwordFlag";

WebBrowser.maybeCompleteAuthSession();

type Step = "email" | "code" | "password";

// Only this account (App Store review) has a password, so only it should see
// the password sign-in link. Everyone else uses OTP or Google.
const REVIEW_EMAIL = "sahithb314@gmail.com";

// Both the auth-browser result and the deep-link fallback can observe the
// same redirect; only the first observer acts on it.
const handledCodes = new Set<string>();

// Regex extraction — host-less URLs (waft://...) are the shape URL parsers
// fumble, so never trust them for this.
function extractParam(url: string, name: string): string | null {
  const match = url.match(new RegExp(`[?&#]${name}=([^&#]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Implicit flow: tokens ride the redirect fragment. Set them directly —
// no code exchange, no server-side flow state. Returns an error message
// or null on success/no-op.
async function completeFromRedirect(url: string): Promise<string | null> {
  if (handledCodes.has(url)) return null;
  handledCodes.add(url);
  const accessToken = extractParam(url, "access_token");
  const refreshToken = extractParam(url, "refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) console.log("[oauth] setSession error:", error.message);
    return error ? error.message : null;
  }
  // PKCE-style ?code= fallback, in case the server ever sends one
  const authCode = extractParam(url, "code");
  if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (error) console.log("[oauth] exchange error:", error.message);
    return error ? error.message : null;
  }
  const errDesc = extractParam(url, "error_description");
  return errDesc ? errDesc : "no tokens in redirect";
}

export function SignInScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True if this device has ever set a password — surfaces the password login.
  const [hasPassword, setHasPassword] = useState(false);
  useEffect(() => {
    getHasPassword().then(setHasPassword);
  }, []);

  // Secondary path — not part of the normal OTP/OAuth flow. Kept low-key
  // (a small link) so it doesn't complicate the primary "20-second signup",
  // but it gives a no-inbox, no-OAuth login for accounts provisioned with a
  // password (e.g. the App Store review account).
  async function signInWithPassword() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setError("Wrong email or password.");
  }

  // Fallback capture: if the auth browser doesn't self-close on the
  // waft:// redirect (simulator quirk), iOS routes the deep link to the
  // app — complete the exchange from here and dismiss the browser.
  useEffect(() => {
    async function handleUrl(url: string) {
      if (!url.startsWith("waft://")) return;
      console.log("[oauth] deep-link fallback:", url.slice(0, 60));
      WebBrowser.dismissAuthSession();
      await completeFromRedirect(url);
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
        const message = await completeFromRedirect(result.url);
        if (message) throw new Error(`sign-in failed: ${message}`);
      } else {
        console.log("[oauth] non-success result:", result.type);
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

      {step === "email" && (
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
      )}

      {step === "code" && (
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

      {step === "password" && (
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
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <AppButton
            title="Sign in"
            onPress={signInWithPassword}
            disabled={!email.includes("@") || password.length === 0}
            busy={busy}
          />
          <Pressable onPress={() => setStep("email")}>
            <Text style={styles.link}>Back to code sign-in</Text>
          </Pressable>
        </>
      )}

      {step !== "password" && (
        <>
          <View style={styles.divider} />
          <AppButton
            title="Continue with Google"
            variant="ghost"
            onPress={() => signInWithProvider("google")}
            disabled={busy}
          />
        </>
      )}

      {busy && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {/* Password sign-in is only surfaced for accounts that have a password
          (currently just the App Store review account) — normal users never
          see it, so they aren't tempted into a path that can't work for them. */}
      {step === "email" && (hasPassword || email.trim().toLowerCase() === REVIEW_EMAIL) && (
        <Pressable onPress={() => setStep("password")}>
          <Text style={styles.faintLink}>Sign in with password</Text>
        </Pressable>
      )}
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
  faintLink: { color: colors.textFaint, textAlign: "center", paddingVertical: 8, fontSize: 13 },
  spinner: { marginTop: 8 },
  error: { color: colors.danger, textAlign: "center" },
});

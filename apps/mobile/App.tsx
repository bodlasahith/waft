import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";
import { colors, radii } from "./src/theme";

// Crash + error reporting. No-op without a DSN (local dev), active in
// TestFlight/production builds where EXPO_PUBLIC_SENTRY_DSN is baked in.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  // A demo build is worth full traces; dial down if volume ever matters.
  tracesSampleRate: 1.0,
});
import { Session } from "@supabase/supabase-js";
import { supabase } from "./src/supabase";
import { api, ApiError } from "./src/api";
import { takePendingAppleName } from "./src/appleName";
import { WaftLogo } from "./src/components/WaftLogo";
import { SignInScreen } from "./src/screens/SignInScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { CardScreen } from "./src/screens/CardScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { GraphScreen } from "./src/screens/GraphScreen";
import { EventsScreen } from "./src/screens/EventsScreen";

// Deliberately no navigation library yet — these screens don't earn one.
const TABS = [
  { key: "card", label: "My Card", screen: CardScreen },
  { key: "scan", label: "Scan", screen: ScanScreen },
  { key: "graph", label: "Network", screen: GraphScreen },
  { key: "events", label: "Events", screen: EventsScreen },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type Profile = "loading" | "missing" | "ready";

// Placeholder name for the rare OAuth case where no real name is available
// (Apple only returns a name on the first authorization, and private-relay
// emails have no usable local-part). Better than blocking an Apple user on a
// required-name screen (App Store Guideline 4) — they can fix it in Settings.
const FALLBACK_NAME = "New Waftie";

// Turn an email local-part into a plausible display name
// ("sahith.bodla@x.com" → "Sahith Bodla"). Returns "" for opaque locals (e.g.
// Apple private-relay hashes) so we never invent a nonsense name.
function nameFromEmail(email?: string | null): string {
  const local = (email ?? "").split("@")[0] ?? "";
  if (!local || /^[0-9a-f]{8,}$/i.test(local)) return "";
  return local
    .replace(/[._+-]+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>("loading");
  // Pre-fills the onboarding name field (email sign-ins, or the rare OAuth
  // fallback) so it's never an empty required box.
  const [onboardName, setOnboardName] = useState("");
  const [tab, setTab] = useState<TabKey>("card");
  const [showSettings, setShowSettings] = useState(false);

  // Quick crossfade when switching tabs.
  const tabFade = useRef(new Animated.Value(1)).current;
  function switchTab(next: TabKey) {
    setShowSettings(false);
    if (next === tab) return;
    tabFade.setValue(0);
    setTab(next);
    Animated.timing(tabFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile("loading");
      // Reset navigation so the next sign-in always starts on the card,
      // never on a screen (e.g. Settings) left open before signing out.
      setShowSettings(false);
      setTab("card");
      return;
    }
    (async () => {
      try {
        await api.me();
        setProfile("ready");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          // OAuth providers vouch for identity, so we must never make the user
          // re-enter a name they already gave (App Store Guideline 4 / Sign in
          // with Apple). Google puts the name in user_metadata; Apple hands it
          // back only on the FIRST authorization (stashed via
          // takePendingAppleName). When neither is present for an OAuth user we
          // derive a name and register silently rather than showing the prompt.
          // Only email/OTP sign-ins (no verified name) get the one-field
          // onboarding screen.
          const provider = session.user.app_metadata?.provider;
          const isOAuth = provider === "apple" || provider === "google";
          const provided = session.user.user_metadata?.full_name || takePendingAppleName();
          const derived = nameFromEmail(session.user.email);
          const name =
            typeof provided === "string" && provided.trim()
              ? provided.trim()
              : isOAuth
                ? derived || FALLBACK_NAME
                : "";
          if (name) {
            try {
              await api.register(name, session.user.user_metadata?.avatar_url);
              setProfile("ready");
              return;
            } catch {
              // Registration itself failed (e.g. API unreachable) — not a name
              // problem. Fall through; onboarding pre-fills the derived name so
              // even here an OAuth user never faces an empty required field.
            }
          }
          setOnboardName(derived);
          setProfile("missing");
        }
        // Non-404 (API down etc.): stay in loading; screens surface errors.
        else setProfile("ready");
      }
    })();
  }, [session]);

  if (!sessionLoaded) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <SignInScreen />
      </SafeAreaView>
    );
  }

  if (profile === "missing") {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <OnboardingScreen initialName={onboardName} onDone={() => setProfile("ready")} />
      </SafeAreaView>
    );
  }

  // Still checking for (or silently creating) the profile — don't mount the
  // tabs yet, or CardScreen fetches a profile that doesn't exist and shows
  // an error until something re-renders it.
  if (profile === "loading") {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingHint}>Setting up your card…</Text>
      </SafeAreaView>
    );
  }

  const Screen = TABS.find((t) => t.key === tab)!.screen;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <WaftLogo size={26} />
        <Pressable onPress={() => setShowSettings(true)} hitSlop={12}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>
      {showSettings ? (
        <Animated.View style={styles.content}>
          <SettingsScreen onClose={() => setShowSettings(false)} />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.content, { opacity: tabFade }]}>
          <Screen />
        </Animated.View>
      )}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActivePill]}
              onPress={() => switchTab(t.key)}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  headerDot: { color: colors.accent },
  loadingHint: { color: colors.textMuted, marginTop: 12 },
  signOut: { color: colors.textFaint, fontSize: 13 },
  settingsIcon: { color: colors.textMuted, fontSize: 22 },
  content: { flex: 1 },
  tabBarWrap: { paddingHorizontal: 16, paddingBottom: 6, paddingTop: 4 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  tabActivePill: { backgroundColor: colors.accentSoft },
  tabLabel: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  tabActive: { color: colors.accent },
});

// Sentry.wrap adds an error boundary + touch/navigation breadcrumbs.
export default Sentry.wrap(App);

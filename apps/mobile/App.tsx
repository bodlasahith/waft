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

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>("loading");
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
          // OAuth providers give us a display name — register silently and
          // skip onboarding; email sign-ins get asked for a name. Google puts
          // it in user_metadata; Apple only hands it back once at sign-in, so
          // it's stashed there (takePendingAppleName).
          const metaName = session.user.user_metadata?.full_name || takePendingAppleName();
          if (typeof metaName === "string" && metaName.trim()) {
            try {
              await api.register(metaName.trim(), session.user.user_metadata?.avatar_url);
              setProfile("ready");
              return;
            } catch {
              // fall through to manual onboarding
            }
          }
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
        <OnboardingScreen onDone={() => setProfile("ready")} />
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
        <WaftLogo size={22} />
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

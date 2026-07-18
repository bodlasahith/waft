import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./src/supabase";
import { api, ApiError } from "./src/api";
import { SignInScreen } from "./src/screens/SignInScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { CardScreen } from "./src/screens/CardScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { GraphScreen } from "./src/screens/GraphScreen";

// Deliberately no navigation library yet — these screens don't earn one.
const TABS = [
  { key: "card", label: "My Card", screen: CardScreen },
  { key: "scan", label: "Scan", screen: ScanScreen },
  { key: "graph", label: "Network", screen: GraphScreen },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type Profile = "loading" | "missing" | "ready";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>("loading");
  const [tab, setTab] = useState<TabKey>("card");

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
      return;
    }
    (async () => {
      try {
        await api.me();
        setProfile("ready");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          // OAuth providers give us a display name — register silently and
          // skip onboarding; email sign-ins get asked for a name.
          const metaName = session.user.user_metadata?.full_name;
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
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
        <SignInScreen />
      </SafeAreaView>
    );
  }

  if (profile === "missing") {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="auto" />
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
        <StatusBar style="auto" />
        <ActivityIndicator />
        <Text style={styles.loadingHint}>Setting up your card…</Text>
      </SafeAreaView>
    );
  }

  const Screen = TABS.find((t) => t.key === tab)!.screen;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Waft</Text>
        <Pressable onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <Screen />
      </View>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafafa" },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  loadingHint: { color: "#888", marginTop: 12 },
  signOut: { color: "#888", fontSize: 13 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabLabel: { color: "#888", fontSize: 15 },
  tabActive: { color: "#4a7dff", fontWeight: "600" },
});

import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CardScreen } from "./src/screens/CardScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { GraphScreen } from "./src/screens/GraphScreen";

// Deliberately no navigation library yet — three screens don't earn one.
// Revisit when auth/onboarding adds real flows.
const TABS = [
  { key: "card", label: "My Card", screen: CardScreen },
  { key: "scan", label: "Scan", screen: ScanScreen },
  { key: "graph", label: "Network", screen: GraphScreen },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function App() {
  const [tab, setTab] = useState<TabKey>("card");
  const Screen = TABS.find((t) => t.key === tab)!.screen;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="auto" />
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

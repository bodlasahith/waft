import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api } from "../api";

interface GraphPerson {
  id: string;
  name: string;
  photoUrl: string | null;
  distance: number;
}

/**
 * Placeholder for the real graph visualization (Sigma is web-only; the
 * native version will need react-native-svg or skia). For now: your
 * network as a list grouped by degrees of separation, so the data flow
 * is exercised end to end.
 */
export function GraphScreen() {
  const [people, setPeople] = useState<GraphPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setPeople(await api.myGraph());
      setError(null);
    } catch (e: any) {
      setError(e?.status === 401 ? "Sign in to see your network." : "Couldn't load your network.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }

  if (people && people.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          Your network is empty — scan someone's Waft code to make your first connection.
        </Text>
      </View>
    );
  }

  const sorted = [...(people ?? [])].sort((a, b) => a.distance - b.distance);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.dot, item.distance === 1 ? styles.direct : styles.indirect]} />
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.degree}>
            {item.distance === 1 ? "connected" : `${item.distance}° away`}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  direct: { backgroundColor: "#4a7dff" },
  indirect: { backgroundColor: "#bbb" },
  name: { fontSize: 16, flex: 1 },
  degree: { color: "#888", fontSize: 13 },
  muted: { color: "#888", textAlign: "center" },
});

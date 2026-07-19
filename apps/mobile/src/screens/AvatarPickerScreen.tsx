import { useState } from "react";
import { ActivityIndicator, Button, Pressable, StyleSheet, Text, View } from "react-native";
import Svg from "react-native-svg";
import { AVATAR_COLORS, AVATAR_SHAPES } from "@waft/shared";
import { api, Avatar } from "../api";
import { AvatarNode } from "../components/AvatarNode";

interface Props {
  current: Avatar | null;
  initial: string;
  onDone: () => void;
}

/** Pick the color + shape your node wears in every graph. */
export function AvatarPickerScreen({ current, initial, onDone }: Props) {
  const [color, setColor] = useState<string>(current?.color ?? AVATAR_COLORS[0]);
  const [shape, setShape] = useState<string>(current?.shape ?? "circle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.setAvatar({ color, shape } as Avatar);
      onDone();
    } catch {
      setError("Couldn't save — try again.");
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your node</Text>
      <Text style={styles.muted}>This is you, in every graph you appear in.</Text>

      <Svg width={120} height={120}>
        <AvatarNode x={60} y={60} r={40} color={color} shape={shape} initial={initial} />
      </Svg>

      <Text style={styles.sectionLabel}>Color</Text>
      <View style={styles.swatches}>
        {AVATAR_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSelected]}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Shape</Text>
      <View style={styles.shapes}>
        {AVATAR_SHAPES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setShape(s)}
            style={[styles.shapeOption, shape === s && styles.shapeSelected]}
          >
            <Svg width={44} height={44}>
              <AvatarNode x={22} y={22} r={14} color={shape === s ? color : "#aab4c8"} shape={s} />
            </Svg>
          </Pressable>
        ))}
      </View>

      <Button title="Save" onPress={save} disabled={busy} />
      <Pressable onPress={onDone}>
        <Text style={styles.cancel}>Cancel</Text>
      </Pressable>
      {busy && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  muted: { color: "#888", textAlign: "center" },
  sectionLabel: { color: "#888", alignSelf: "flex-start", marginTop: 8 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: "#222" },
  shapes: { flexDirection: "row", gap: 10 },
  shapeOption: { borderRadius: 10, borderWidth: 2, borderColor: "transparent", padding: 2 },
  shapeSelected: { borderColor: "#222" },
  cancel: { color: "#888", paddingTop: 4 },
  error: { color: "#c00" },
});

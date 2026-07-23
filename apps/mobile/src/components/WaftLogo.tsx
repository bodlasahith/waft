import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Polygon, Stop } from "react-native-svg";
import { colors } from "../theme";

// Static ribbon-W mark for headers — matches the app icon (no animation).
// The animated coalesce lockup lives on the sign-in screen; this is the small,
// always-reliable version for the app chrome.
const V: [number, number][] = [
  [22, 30],
  [39, 74],
  [50, 48],
  [61, 74],
  [78, 30],
];

function taper(a: [number, number], b: [number, number], H: number) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const ux = -dy / L;
  const uy = dx / L;
  const m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const E = Math.max(1.1, H * 0.24);
  return [
    [a[0] + ux * E, a[1] + uy * E],
    [m[0] + ux * H, m[1] + uy * H],
    [b[0] + ux * E, b[1] + uy * E],
    [b[0] - ux * E, b[1] - uy * E],
    [m[0] - ux * H, m[1] - uy * H],
    [a[0] - ux * E, a[1] - uy * E],
  ]
    .map((p) => p.map((v) => v.toFixed(1)).join(","))
    .join(" ");
}
const RIBS = [0, 1, 2, 3].map((i) => taper(V[i], V[i + 1], 6.6));

export function WaftLogo({ size = 22 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="16 24 68 56">
        <Defs>
          <LinearGradient id="hw" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#eef2ff" />
            <Stop offset="0.55" stopColor="#b9c8ff" />
            <Stop offset="1" stopColor="#6c8cff" />
          </LinearGradient>
        </Defs>
        {RIBS.map((pts, i) => (
          <Polygon key={i} points={pts} fill="url(#hw)" />
        ))}
      </Svg>
      <Text style={[styles.word, { fontSize: size }]}>waft</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  word: { fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
});

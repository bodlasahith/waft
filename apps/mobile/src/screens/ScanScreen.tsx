import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { api } from "../api";
import { CARD_ORIGIN } from "../config";

type ScanState =
  | { kind: "scanning" }
  | { kind: "busy" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * Waft QR payloads are web URLs so native cameras work without the app:
 *   <CARD_ORIGIN>/c/<cardCode>   — a person's card
 *   <CARD_ORIGIN>/e/<eventCode>  — an event room
 */
function parseWaftUrl(data: string): { type: "card" | "event"; code: string } | null {
  if (!data.startsWith(`${CARD_ORIGIN}/`)) return null;
  const [kind, code] = data.slice(CARD_ORIGIN.length + 1).split("/");
  if (kind === "c" && code) return { type: "card", code };
  if (kind === "e" && code) return { type: "event", code };
  return null;
}

// Survives tab switches (screens unmount): once you check into an event,
// connections you scan are attributed to it so they appear on its live graph.
let activeEvent: { id: string; name: string } | null = null;

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ kind: "scanning" });

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Waft needs the camera to scan QR codes.</Text>
        <Button title="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  async function handleScan(data: string) {
    const parsed = parseWaftUrl(data);
    if (!parsed) {
      setState({ kind: "error", message: "Not a Waft code." });
      return;
    }
    setState({ kind: "busy" });
    try {
      if (parsed.type === "card") {
        const card = await api.card(parsed.code);
        const result = await api.connect(card.id, activeEvent?.id);
        const suffix = activeEvent ? ` (at ${activeEvent.name})` : "";
        setState({
          kind: "done",
          message:
            result.status === "already_connected"
              ? `You already share a waft with ${card.name}!${suffix}`
              : `Connected with ${card.name}!${suffix}`,
        });
      } else {
        const event = await api.eventByCode(parsed.code);
        await api.checkin(event.id);
        activeEvent = { id: event.id, name: event.name };
        setState({ kind: "done", message: `Checked into ${event.name}!` });
      }
    } catch (e: any) {
      const message =
        e?.status === 401
          ? "Sign in to connect."
          : e?.body?.error === "cannot_connect_to_self"
            ? "That's your own card!"
            : "Something went wrong.";
      setState({ kind: "error", message });
    }
  }

  if (state.kind === "done" || state.kind === "error") {
    return (
      <View style={styles.center}>
        <Text style={state.kind === "error" ? styles.error : styles.success}>{state.message}</Text>
        <Button title="Scan again" onPress={() => setState({ kind: "scanning" })} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          state.kind === "scanning" ? ({ data }) => handleScan(data) : undefined
        }
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {state.kind === "busy" ? "Connecting…" : "Point at a Waft QR code"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  overlay: { position: "absolute", bottom: 48, alignSelf: "center" },
  overlayText: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  muted: { color: "#888", textAlign: "center" },
  success: { fontSize: 20, fontWeight: "600", textAlign: "center" },
  error: { fontSize: 16, color: "#c00", textAlign: "center" },
});

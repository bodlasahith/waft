import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
import { CameraView, useCameraPermissions } from "expo-camera";
import { api, ApiError } from "../api";
import { CARD_ORIGIN } from "../config";
import { getActiveEvent, setActiveEvent } from "../eventContext";

type ScanState =
  | { kind: "scanning" }
  | { kind: "busy" }
  | { kind: "done"; message: string; icebreaker?: string }
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

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ kind: "scanning" });

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Waft needs the camera to scan QR codes.</Text>
        <AppButton title="Allow camera" onPress={requestPermission} />
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
        const activeEvent = getActiveEvent();
        const card = await api.card(parsed.code);
        const result = await api.connect(card.id, activeEvent?.id);
        const suffix = activeEvent ? ` (at ${activeEvent.name})` : "";
        setState({
          kind: "done",
          message:
            result.status === "already_connected"
              ? `You already share a waft with ${card.name}!${suffix}`
              : `Connected with ${card.name}!${suffix}`,
          icebreaker: result.icebreaker,
        });
      } else {
        const event = await api.eventByCode(parsed.code);
        const result = await api.checkin(event.id);
        setActiveEvent({ id: event.id, name: event.name });
        setState({
          kind: "done",
          message: `Checked into ${event.name}!`,
          icebreaker: result.icebreaker,
        });
      }
    } catch (e: any) {
      let message: string;
      if (e?.status === 401) message = "Sign in to connect.";
      else if (e?.body?.error === "cannot_connect_to_self") message = "That's your own card!";
      else if (e?.body?.error === "event_ended") message = "This event has ended.";
      else if (e instanceof ApiError) {
        const detail = (e.body as any)?.error ?? "";
        message = `Something went wrong (${e.status}${detail ? ` ${detail}` : ""}).`;
      } else {
        message = `Something went wrong${e?.message ? ` (${e.message})` : ""}.`;
      }
      setState({ kind: "error", message });
    }
  }

  if (state.kind === "done" || state.kind === "error") {
    return (
      <View style={styles.center}>
        <Text style={state.kind === "error" ? styles.error : styles.success}>{state.message}</Text>
        {state.kind === "done" && state.icebreaker && (
          <View style={styles.icebreakerBox}>
            <Text style={styles.icebreakerLabel}>Break the ice</Text>
            <Text style={styles.icebreakerText}>{state.icebreaker}</Text>
          </View>
        )}
        <AppButton title="Scan again" variant="ghost" onPress={() => setState({ kind: "scanning" })} />
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
  muted: { color: colors.textMuted, textAlign: "center" },
  icebreakerBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
    marginHorizontal: 8,
  },
  icebreakerLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  icebreakerText: { fontSize: 17, textAlign: "center", fontStyle: "italic", color: colors.text },
  success: { fontSize: 20, fontWeight: "700", textAlign: "center", color: colors.text },
  error: { fontSize: 16, color: colors.danger, textAlign: "center" },
});

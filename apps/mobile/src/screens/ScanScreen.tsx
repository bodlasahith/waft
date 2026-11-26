import { useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";
import { AppButton } from "../components/UI";
import { CameraView, useCameraPermissions } from "expo-camera";
import { api, ApiError, Avatar, PublicCard } from "../api";
import { CARD_ORIGIN } from "../config";
import { getActiveEvent, setActiveEvent } from "../eventContext";
import {
  ConnectionAnimation,
  EventPreview,
  ProfilePreview,
  ScanOverlay,
} from "../components/scan";

type ScanState =
  | { kind: "scanning" }
  | { kind: "processing" }
  | {
      kind: "connection";
      card: PublicCard;
      alreadyConnected: boolean;
      eventName?: string;
      icebreaker?: string;
    }
  | {
      kind: "event";
      event: { id: string; name: string; location?: string | null };
      icebreaker?: string;
    }
  | { kind: "error"; message: string };

// How long a scan error stays on screen before the camera resumes, and how
// long the same rejected code is ignored (the camera reports it every frame).
const ERROR_RESUME_MS = 2500;
const REJECT_COOLDOWN_MS = 4000;

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

function errorMessage(e: any): string {
  if (e?.status === 401) return "Sign in to connect.";
  if (e?.body?.error === "cannot_connect_to_self") return "That's your own card!";
  if (e?.body?.error === "event_ended") return "This event has ended.";
  if (e?.body?.error === "not_checked_in") return "Check into the event again, then scan.";
  if (e instanceof ApiError && e.status === 404) return "That code isn't active anymore.";
  if (e instanceof ApiError) return "Couldn't connect. Try again in a moment.";
  return "Couldn't reach Waft. Check your connection.";
}

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const [me, setMe] = useState<{ name: string; avatar: Avatar | null } | null>(null);
  // onBarcodeScanned fires per frame; a ref blocks re-entry before the state
  // update lands, and remembers the last rejected code so it isn't re-reported.
  const busy = useRef(false);
  const lastRejected = useRef<{ data: string; at: number } | null>(null);

  useEffect(() => {
    api.me().then(
      (p) => setMe({ name: p.name, avatar: p.avatar }),
      () => {}
    );
  }, []);

  // Errors are transient: show the message, then go back to scanning.
  useEffect(() => {
    if (state.kind !== "error") return;
    const t = setTimeout(() => resume(), ERROR_RESUME_MS);
    return () => clearTimeout(t);
  }, [state]);

  function resume() {
    busy.current = false;
    setState({ kind: "scanning" });
  }

  function fail(message: string, data?: string) {
    if (data) lastRejected.current = { data, at: Date.now() };
    setState({ kind: "error", message });
  }

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    // Apple 5.1.1(iv): the button that triggers the OS permission prompt must
    // not use "Allow"-style wording that pre-empts the system dialog — use a
    // neutral "Continue". Once the user has denied and iOS won't re-prompt
    // (canAskAgain === false), the button here can't do anything, so point
    // them to Settings instead of a dead end.
    const canPrompt = permission.canAskAgain;
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          {canPrompt
            ? "Waft uses the camera to scan QR codes and connect with people you meet."
            : "Camera access is off. Enable it for Waft in Settings to scan QR codes."}
        </Text>
        <AppButton
          title={canPrompt ? "Continue" : "Open Settings"}
          onPress={canPrompt ? requestPermission : () => Linking.openSettings()}
        />
      </View>
    );
  }

  async function handleScan(data: string) {
    if (busy.current) return;
    const rejected = lastRejected.current;
    if (rejected && rejected.data === data && Date.now() - rejected.at < REJECT_COOLDOWN_MS) {
      return;
    }
    busy.current = true;

    const parsed = parseWaftUrl(data);
    if (!parsed) {
      fail("That's not a Waft code.", data);
      return;
    }
    setState({ kind: "processing" });
    try {
      if (parsed.type === "card") {
        const activeEvent = getActiveEvent();
        const card = await api.card(parsed.code);
        const result = await api.connect(card.id, activeEvent?.id);
        // Re-read the card now that we're connected: connection-tier socials
        // were hidden from the pre-connect read. Fall back to what we have.
        const fullCard = await api.card(parsed.code).catch(() => card);
        setState({
          kind: "connection",
          card: fullCard,
          alreadyConnected: result.status === "already_connected",
          eventName: activeEvent?.name,
          icebreaker: result.icebreaker,
        });
      } else {
        const event = await api.eventByCode(parsed.code);
        const result = await api.checkin(event.id);
        setActiveEvent({ id: event.id, name: event.name });
        setState({ kind: "event", event, icebreaker: result.icebreaker });
      }
    } catch (e: any) {
      fail(errorMessage(e), data);
    }
  }

  const subtitle =
    state.kind === "connection"
      ? state.alreadyConnected
        ? "You're already connected"
        : state.eventName
          ? `Connected at ${state.eventName}`
          : "New connection"
      : undefined;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={state.kind === "scanning" ? ({ data }) => handleScan(data) : undefined}
      />
      <ScanOverlay visible={state.kind === "connection" || state.kind === "event"}>
        {state.kind === "connection" && (
          <>
            <ConnectionAnimation
              me={{
                color: me?.avatar?.color ?? colors.accent,
                shape: me?.avatar?.shape,
                initial: me?.name.charAt(0) ?? "Y",
              }}
              them={{
                color: state.card.avatar?.color ?? colors.accent,
                shape: state.card.avatar?.shape,
                initial: state.card.name.charAt(0),
              }}
              alreadyConnected={state.alreadyConnected}
            />
            <ProfilePreview
              visible
              profile={state.card}
              subtitle={subtitle}
              icebreaker={state.icebreaker}
              onDone={resume}
              delayMs={state.alreadyConnected ? 300 : 1400}
            />
          </>
        )}
        {state.kind === "event" && (
          <EventPreview
            visible
            eventName={state.event.name}
            location={state.event.location}
            icebreaker={state.icebreaker}
            onDone={resume}
          />
        )}
      </ScanOverlay>
      {(state.kind === "scanning" || state.kind === "processing" || state.kind === "error") && (
        <View style={styles.overlay}>
          <Text style={[styles.overlayText, state.kind === "error" && styles.overlayError]}>
            {state.kind === "processing"
              ? "Connecting…"
              : state.kind === "error"
                ? state.message
                : getActiveEvent()
                  ? `Scanning at ${getActiveEvent()!.name}`
                  : "Point at a Waft QR code"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  overlay: { position: "absolute", bottom: 48, left: 24, right: 24, alignItems: "center" },
  overlayText: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
    overflow: "hidden",
    textAlign: "center",
  },
  overlayError: { backgroundColor: "rgba(120,20,30,0.85)" },
  muted: { color: colors.textMuted, textAlign: "center" },
});

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { api, WaftEvent } from "../api";
import { CARD_ORIGIN } from "../config";

type Mode = { kind: "list" } | { kind: "create" } | { kind: "detail"; event: WaftEvent };

/**
 * Host flow: create an event, get its QR (what attendees scan to check in)
 * and the live wall URL (what you project). Icebreakers are AI-generated
 * from the event name unless the host writes their own.
 */
export function EventsScreen() {
  const [events, setEvents] = useState<WaftEvent[] | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .myEvents()
      .then((e) => {
        setEvents(e);
        setError(null);
      })
      .catch(() => setError("Couldn't load your events."));
  }, []);

  useEffect(load, [load]);

  if (mode.kind === "create") {
    return (
      <CreateEventForm
        onCreated={(event) => {
          load();
          setMode({ kind: "detail", event });
        }}
        onCancel={() => setMode({ kind: "list" })}
      />
    );
  }

  if (mode.kind === "detail") {
    return <EventDetail event={mode.event} onBack={() => setMode({ kind: "list" })} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your events</Text>
        <Pressable onPress={() => setMode({ kind: "create" })}>
          <Text style={styles.link}>+ New event</Text>
        </Pressable>
      </View>

      {events === null && !error && <ActivityIndicator style={styles.spacer} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {events?.length === 0 && (
        <Text style={styles.muted}>
          No events yet. Create one, project the live wall, and watch the room connect.
        </Text>
      )}
      {events?.map((event) => (
        <Pressable
          key={event.id}
          style={styles.row}
          onPress={() => setMode({ kind: "detail", event })}
        >
          <View>
            <Text style={styles.rowName}>{event.name}</Text>
            <Text style={styles.rowMeta}>
              {new Date(event.starts_at).toLocaleDateString()}
              {event.location ? ` · ${event.location}` : ""}
              {event.ends_at && new Date(event.ends_at) <= new Date() ? " · ended" : ""}
            </Text>
          </View>
          <Text style={styles.rowCode}>{event.code}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CreateEventForm({
  onCreated,
  onCancel,
}: {
  onCreated: (event: WaftEvent) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [icebreakers, setIcebreakers] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const custom = icebreakers
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const event = await api.createEvent(name.trim(), location.trim(), custom);
      onCreated(event);
    } catch {
      setError("Couldn't create the event — try again.");
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New event</Text>
      <TextInput
        style={styles.input}
        placeholder="Event name"
        autoFocus
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Location (optional)"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={"Icebreakers, one per line (optional — leave empty and AI writes them from the event name)"}
        multiline
        value={icebreakers}
        onChangeText={setIcebreakers}
      />
      <Button
        title={busy ? "Creating…" : "Create event"}
        onPress={create}
        disabled={busy || name.trim().length === 0}
      />
      <Pressable onPress={onCancel}>
        <Text style={styles.cancel}>Cancel</Text>
      </Pressable>
      {busy && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

function EventDetail({ event: initial, onBack }: { event: WaftEvent; onBack: () => void }) {
  const [event, setEvent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [attendees, setAttendees] = useState<{ id: string; name: string }[] | null>(null);
  const [wallExpired, setWallExpired] = useState(false);
  const ended = !!event.ends_at && new Date(event.ends_at) <= new Date();
  const wallUrl = `${CARD_ORIGIN}/event/${event.id}`;

  useEffect(() => {
    api
      .eventGraph(event.id)
      .then((g) => setAttendees(g.nodes))
      .catch((e) => {
        if (e?.status === 410) setWallExpired(true);
        setAttendees([]);
      });
  }, [event.id]);

  async function endEvent() {
    setBusy(true);
    try {
      setEvent(await api.endEvent(event.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, styles.centered]}>
      <Text style={styles.title}>{event.name}</Text>
      {ended && <Text style={styles.endedTag}>Ended — no new check-ins</Text>}
      {/* pointerEvents="none": the SVG QR swallows drag gestures otherwise,
          which made the page impossible to scroll from the middle. */}
      <View style={styles.qrWrap} pointerEvents="none">
        <QRCode value={`${CARD_ORIGIN}/e/${event.code}`} size={220} />
      </View>
      <Text style={styles.muted}>Attendees scan this to check in</Text>

      {!ended ? (
        <>
          <Pressable style={styles.wallButton} onPress={() => Linking.openURL(wallUrl)}>
            <Text style={styles.wallButtonText}>Open live wall</Text>
          </Pressable>
          <Text style={styles.wallUrl}>{wallUrl}</Text>
        </>
      ) : (
        <Text style={styles.muted}>
          {wallExpired ? "The live wall has expired." : "The live wall stays up for 24 hours."}
        </Text>
      )}

      {attendees && attendees.length > 0 && (
        <View style={styles.iceList}>
          <Text style={styles.iceLabel}>
            {attendees.length} attendee{attendees.length === 1 ? "" : "s"}
          </Text>
          {attendees.map((a) => (
            <Text key={a.id} style={styles.iceItem}>
              • {a.name}
            </Text>
          ))}
        </View>
      )}

      {event.icebreakers && event.icebreakers.length > 0 && (
        <View style={styles.iceList}>
          <Text style={styles.iceLabel}>Icebreakers</Text>
          {event.icebreakers.map((q, i) => (
            <Text key={i} style={styles.iceItem}>
              • {q}
            </Text>
          ))}
        </View>
      )}

      {!ended && (
        <Pressable style={styles.endButton} onPress={endEvent} disabled={busy}>
          <Text style={styles.endButtonText}>{busy ? "Ending…" : "End event"}</Text>
        </Pressable>
      )}

      <Pressable onPress={onBack}>
        <Text style={styles.cancel}>Back to events</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  centered: { alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  link: { color: "#4a7dff", fontSize: 15, fontWeight: "600" },
  spacer: { marginTop: 24 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  rowName: { fontWeight: "600", fontSize: 15 },
  rowMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  rowCode: { color: "#4a7dff", fontFamily: "Courier", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  cancel: { color: "#888", textAlign: "center", paddingVertical: 8 },
  muted: { color: "#888", textAlign: "center" },
  error: { color: "#c00", textAlign: "center" },
  qrWrap: { padding: 16, backgroundColor: "#fff", borderRadius: 16 },
  wallButton: {
    backgroundColor: "#4a7dff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  wallButtonText: { color: "#fff", fontWeight: "600" },
  wallUrl: { color: "#888", fontSize: 12 },
  iceList: { alignSelf: "stretch", backgroundColor: "#fff", borderRadius: 12, padding: 14, gap: 6 },
  iceLabel: {
    color: "#4a7dff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iceItem: { fontSize: 14, color: "#333" },
  endedTag: { color: "#c00", fontWeight: "600", fontSize: 13 },
  endButton: {
    borderWidth: 1,
    borderColor: "#c00",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  endButtonText: { color: "#c00", fontWeight: "600" },
});

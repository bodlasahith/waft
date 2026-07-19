import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import QRCode from "react-native-qrcode-svg";
import { api, WaftEvent } from "../api";
import { CARD_ORIGIN } from "../config";
import { setActiveEvent } from "../eventContext";

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "detail"; event: WaftEvent; isHost: boolean };

/**
 * Your events, both sides of the QR: ones you host (create, end, project
 * the wall) and ones you attended (who you met there). Icebreakers are
 * AI-generated from the event name unless the host writes their own.
 */
export function EventsScreen() {
  const [hosted, setHosted] = useState<WaftEvent[] | null>(null);
  const [attended, setAttended] = useState<WaftEvent[] | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.myEvents(), api.attendedEvents()])
      .then(([mine, went]) => {
        setHosted(mine);
        // An event you host and also checked into belongs under Hosting.
        const mineIds = new Set(mine.map((e) => e.id));
        setAttended(went.filter((e) => !mineIds.has(e.id)));
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
          setMode({ kind: "detail", event, isHost: true });
        }}
        onCancel={() => setMode({ kind: "list" })}
      />
    );
  }

  if (mode.kind === "detail") {
    return (
      <EventDetail
        event={mode.event}
        isHost={mode.isHost}
        onBack={() => {
          load();
          setMode({ kind: "list" });
        }}
      />
    );
  }

  const renderRow = (event: WaftEvent, isHost: boolean) => (
    <Pressable
      key={event.id}
      style={styles.row}
      onPress={() => setMode({ kind: "detail", event, isHost })}
    >
      <View>
        <Text style={styles.rowName}>{event.name}</Text>
        <Text style={styles.rowMeta}>
          {new Date(event.starts_at).toLocaleDateString()}
          {event.location ? ` · ${event.location}` : ""}
          {event.ends_at && new Date(event.ends_at) <= new Date() ? " · ended" : ""}
        </Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Pressable onPress={() => setMode({ kind: "create" })}>
          <Text style={styles.link}>+ New event</Text>
        </Pressable>
      </View>

      <JoinByCode onJoined={load} />

      {hosted === null && !error && <ActivityIndicator style={styles.spacer} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {hosted && hosted.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Hosting</Text>
          {hosted.map((e) => renderRow(e, true))}
        </>
      )}
      {attended && attended.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Attended</Text>
          {attended.map((e) => renderRow(e, false))}
        </>
      )}
      {hosted?.length === 0 && attended?.length === 0 && (
        <Text style={styles.muted}>
          No events yet. Create one and project the live wall, or scan an event QR to check in —
          everyone you meet there ends up here.
        </Text>
      )}
    </ScrollView>
  );
}

/**
 * Check in without scanning — for when the QR is out of reach and someone
 * reads the event code aloud. Same flow as scanning the event QR, including
 * the icebreaker and event attribution for subsequent card scans.
 */
function JoinByCode({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function join() {
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      const event = await api.eventByCode(code.trim());
      const result = await api.checkin(event.id);
      setActiveEvent({ id: event.id, name: event.name });
      setMessage(
        `Checked into ${event.name}!${result.icebreaker ? `\n\n"${result.icebreaker}"` : ""}`
      );
      setCode("");
      onJoined();
    } catch (e: any) {
      setFailed(true);
      setMessage(
        e?.body?.error === "event_ended"
          ? "This event has ended."
          : e?.status === 404
            ? "No event with that code."
            : "Couldn't join — try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.joinBox}>
      <View style={styles.joinRow}>
        <TextInput
          style={[styles.input, styles.joinInput]}
          placeholder="Event code"
          autoCapitalize="none"
          autoCorrect={false}
          value={code}
          onChangeText={(t) => {
            setCode(t);
            setMessage(null);
          }}
        />
        <Button title="Join" onPress={join} disabled={busy || code.trim().length < 6} />
      </View>
      {message && (
        <Text style={failed ? styles.error : styles.joinSuccess}>{message}</Text>
      )}
    </View>
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
  const [startsAt, setStartsAt] = useState(new Date());
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (endsAt && endsAt <= startsAt) {
      setError("The end time must be after the start time.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const custom = icebreakers
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const event = await api.createEvent(
        name.trim(),
        location.trim(),
        custom,
        startsAt,
        endsAt ?? undefined
      );
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
      <View style={styles.scheduleRow}>
        <Text style={styles.scheduleLabel}>Starts</Text>
        <DateTimePicker
          value={startsAt}
          mode="datetime"
          onChange={(_, date) => date && setStartsAt(date)}
        />
      </View>
      <View style={styles.scheduleRow}>
        <Text style={styles.scheduleLabel}>Ends</Text>
        {endsAt ? (
          <View style={styles.scheduleValue}>
            <DateTimePicker
              value={endsAt}
              mode="datetime"
              onChange={(_, date) => date && setEndsAt(date)}
            />
            <Pressable onPress={() => setEndsAt(null)}>
              <Text style={styles.removeEnd}>×</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEndsAt(new Date(startsAt.getTime() + 2 * 3600_000))}>
            <Text style={styles.link}>+ Add end time</Text>
          </Pressable>
        )}
      </View>
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

function EventDetail({
  event: initial,
  isHost,
  onBack,
}: {
  event: WaftEvent;
  isHost: boolean;
  onBack: () => void;
}) {
  const [event, setEvent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [attendees, setAttendees] = useState<{ id: string; name: string }[] | null>(null);
  const [met, setMet] = useState<{ id: string; name: string }[] | null>(null);
  const [wallExpired, setWallExpired] = useState(false);
  const ended = !!event.ends_at && new Date(event.ends_at) <= new Date();
  const wallUrl = `${CARD_ORIGIN}/event/${event.id}`;

  useEffect(() => {
    api
      .eventConnections(event.id)
      .then(setMet)
      .catch(() => setMet([]));
  }, [event.id]);

  const loadAttendees = useCallback(() => {
    api
      .eventGraph(event.id)
      .then((g) => setAttendees(g.nodes))
      .catch((e) => {
        if (e?.status === 410) setWallExpired(true);
        setAttendees((prev) => prev ?? []);
      });
  }, [event.id]);

  // Hosts leave this screen open while people arrive — keep the list live.
  useEffect(() => {
    loadAttendees();
    if (ended) return;
    const interval = setInterval(loadAttendees, 10_000);
    return () => clearInterval(interval);
  }, [loadAttendees, ended]);

  function confirmEnd() {
    Alert.alert("End this event?", "Check-ins close immediately. The live wall stays up for 24 hours.", [
      { text: "Cancel", style: "cancel" },
      { text: "End event", style: "destructive", onPress: endEvent },
    ]);
  }

  async function endEvent() {
    setBusy(true);
    try {
      setEvent(await api.endEvent(event.id));
      loadAttendees();
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
      <Text style={styles.muted}>
        Attendees scan this to check in — or join with code{" "}
        <Text style={styles.codeInline}>{event.code}</Text>
      </Text>

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

      {met && met.length > 0 && (
        <View style={styles.iceList}>
          <Text style={styles.iceLabel}>You connected with</Text>
          {met.map((p) => (
            <Text key={p.id} style={styles.iceItem}>
              • {p.name}
            </Text>
          ))}
        </View>
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

      {isHost && !ended && (
        <Pressable style={styles.endButton} onPress={confirmEnd} disabled={busy}>
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
  sectionHeader: {
    color: "#888",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
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
  rowChevron: { color: "#bbb", fontSize: 22 },
  codeInline: { color: "#4a7dff", fontFamily: "Courier", fontWeight: "600" },
  joinBox: { gap: 6 },
  joinRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  joinInput: { flex: 1 },
  joinSuccess: { color: "#2a8f4d", textAlign: "center" },
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
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 48,
  },
  scheduleLabel: { fontWeight: "600", fontSize: 15 },
  scheduleValue: { flexDirection: "row", alignItems: "center", gap: 10 },
  removeEnd: { color: "#c00", fontSize: 22, paddingHorizontal: 4 },
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

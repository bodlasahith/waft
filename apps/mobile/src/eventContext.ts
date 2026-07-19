// The event you most recently checked into, from either the scanner or
// join-by-code. Card scans while this is set attribute the connection to
// the event (it shows on the event graph/wall). Module-level on purpose —
// it must survive tab switches, which unmount screens.
let activeEvent: { id: string; name: string } | null = null;

export function setActiveEvent(event: { id: string; name: string }) {
  activeEvent = event;
}

export function getActiveEvent() {
  return activeEvent;
}

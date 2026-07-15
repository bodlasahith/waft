import type { WebSocket } from "ws";

const subscribers = new Map<string, Set<WebSocket>>();

export function subscribe(eventId: string, socket: WebSocket) {
  let set = subscribers.get(eventId);
  if (!set) {
    set = new Set();
    subscribers.set(eventId, set);
  }
  set.add(socket);
  socket.on("close", () => unsubscribe(eventId, socket));
}

export function unsubscribe(eventId: string, socket: WebSocket) {
  const set = subscribers.get(eventId);
  if (!set) return;
  set.delete(socket);
  if (set.size === 0) subscribers.delete(eventId);
}

export function broadcast(eventId: string, payload: unknown) {
  const set = subscribers.get(eventId);
  if (!set || set.size === 0) return;
  const message = JSON.stringify(payload);
  for (const socket of set) {
    if (socket.readyState === socket.OPEN) socket.send(message);
  }
}

// API endpoint — override for device testing by setting EXPO_PUBLIC_API_URL
// (a phone on the same network needs your machine's LAN IP, not localhost).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// Public web origin encoded into QR codes / parsed from scans. Default must
// match the real domain (getwaft.app) — a mismatched fallback would silently
// mint QR codes pointing at a domain we don't own if the env var is dropped.
export const CARD_ORIGIN = process.env.EXPO_PUBLIC_CARD_ORIGIN ?? "https://getwaft.app";

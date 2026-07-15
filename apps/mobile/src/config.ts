// API endpoint — override for device testing by setting EXPO_PUBLIC_API_URL
// (a phone on the same network needs your machine's LAN IP, not localhost).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// Public web origin encoded into QR codes / parsed from scans.
export const CARD_ORIGIN = process.env.EXPO_PUBLIC_CARD_ORIGIN ?? "https://waft.app";

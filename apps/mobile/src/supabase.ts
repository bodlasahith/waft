import "react-native-url-polyfill/auto";
import * as Crypto from "expo-crypto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// React Native has no WebCrypto, so auth-js downgraded PKCE to the
// deprecated "plain" challenge method (and its exchange path proved
// unreliable — "invalid flow state"). Shim the two primitives auth-js
// needs so PKCE runs real S256. Must run before createClient.
const g = globalThis as any;
if (!g.crypto) g.crypto = {};
if (!g.crypto.getRandomValues) {
  g.crypto.getRandomValues = (array: Uint8Array) => Crypto.getRandomValues(array);
}
if (!g.crypto.subtle) {
  g.crypto.subtle = {
    digest: (_algorithm: string, data: BufferSource) =>
      Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data),
  };
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — see apps/mobile/.env"
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection in native — SignInScreen handles the
    // redirect explicitly. Implicit flow: tokens arrive in the redirect
    // fragment and are set directly — no server-side flow state, which
    // dodges the PKCE "invalid flow state" rejections we hit on-device
    // (server verified healthy via desktop repro; see git history).
    detectSessionInUrl: false,
    flowType: "implicit",
  },
});

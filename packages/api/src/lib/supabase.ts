import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// We only use Supabase for Postgres REST queries, not Realtime — but the
// client constructor always builds a realtime client, which needs a global
// WebSocket. That's unavailable by default on Node 20 (only Node 22+ has
// it), so we hand it the `ws` package explicitly to stay Node 20-safe.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  // `ws`'s WebSocket type doesn't line up exactly with supabase-js's
  // WebSocketLikeConstructor (event handler signatures differ slightly) —
  // functionally compatible, hence the cast.
  { realtime: { transport: WebSocket as any } }
);

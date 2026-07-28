import { describe, it, expect, vi } from "vitest";

// events.ts imports lib/supabase and lib/auth, which run network-y constructors
// at import time (createClient / createRemoteJWKSet on env-derived URLs). Stub
// them so we can import the *real* pure isWallExpired without live config.
vi.mock("../src/lib/supabase.js", () => ({ supabase: {} }));
vi.mock("../src/lib/auth.js", () => ({
  requireAuth: async () => {},
  optionalAuth: async () => {},
}));

import { isWallExpired } from "../src/routes/events.js";

const HOUR = 3600_000;
const WALL_TTL_HOURS = 24; // grace after an explicit end
const MAX_UNBOUNDED_WALL_HOURS = 48; // cap for walls with no explicit end

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();

describe("isWallExpired", () => {
  it("explicit future ends_at is not expired", () => {
    expect(isWallExpired(iso(2 * HOUR))).toBe(false);
  });

  it("ends_at in the recent past but within the 24h grace is not expired", () => {
    expect(isWallExpired(iso(-1 * HOUR))).toBe(false);
    // Just inside the grace boundary.
    expect(isWallExpired(iso(-(WALL_TTL_HOURS - 1) * HOUR))).toBe(false);
  });

  it("ends_at older than the 24h grace is expired", () => {
    expect(isWallExpired(iso(-(WALL_TTL_HOURS + 1) * HOUR))).toBe(true);
  });

  it("null ends_at: expires MAX_UNBOUNDED_WALL_HOURS (48h) after start", () => {
    // Started 49h ago, no explicit end -> past the 48h cap -> expired.
    expect(isWallExpired(null, iso(-(MAX_UNBOUNDED_WALL_HOURS + 1) * HOUR))).toBe(true);
  });

  it("null ends_at with a recent start is not expired", () => {
    expect(isWallExpired(null, iso(-1 * HOUR))).toBe(false);
    // Just inside the 48h cap.
    expect(isWallExpired(null, iso(-(MAX_UNBOUNDED_WALL_HOURS - 1) * HOUR))).toBe(false);
  });

  it("both null falls open (not expired) — nothing to bound it against", () => {
    expect(isWallExpired(null)).toBe(false);
    expect(isWallExpired(null, null)).toBe(false);
  });

  it("explicit ends_at takes precedence over start — an old start with a fresh end stays live", () => {
    // Multi-day event: started 5 days ago but explicitly ends in the future.
    expect(isWallExpired(iso(2 * HOUR), iso(-5 * 24 * HOUR))).toBe(false);
  });
});

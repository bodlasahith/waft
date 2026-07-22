// Apple returns the user's name only in the credential on their FIRST
// sign-in — never in the identity token or the Supabase session metadata. We
// stash it here at sign-in so App.tsx's silent-registration path can use it
// (mirroring how Google names arrive in user_metadata), then consume it once.
let pendingName: string | null = null;

export function setPendingAppleName(name: string) {
  pendingName = name.trim() || null;
}

/** Returns the stashed name and clears it — consume once. */
export function takePendingAppleName(): string | null {
  const n = pendingName;
  pendingName = null;
  return n;
}

"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Pre-install invite capture: someone viewing a web card (before they have
// the app) leaves their email so they're auto-connected to the card owner the
// moment they sign up — no second QR scan. The edge only forms once they
// authenticate with this email (POST /users fulfills the pending record).
export function ConnectOnJoin({ cardCode, name }: { cardCode: string; name: string }) {
  const first = name?.trim().split(/\s+/)[0] || "them";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit() {
    setState("sending");
    try {
      const res = await fetch(`${API}/connections/pending`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode, email: email.trim() }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent)]/10 px-4 py-3 text-center">
        <p className="text-sm text-[var(--text)]">
          You&apos;re set — you&apos;ll connect with{" "}
          <span className="font-semibold">{first}</span> the moment you join.
        </p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <label className="block text-sm text-[var(--muted)] mb-2 text-center">
        Connect with <span className="text-[var(--text)] font-semibold">{first}</span> when you join
      </label>
      <div className="flex gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--ground-2)]/60 px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--faint)] focus:border-[var(--border-strong)] outline-none transition-colors"
        />
        <button
          onClick={submit}
          disabled={!email.includes("@") || state === "sending"}
          className="btn-primary px-4 py-2.5 text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === "sending" ? "…" : "Connect"}
        </button>
      </div>
      {state === "error" && (
        <p className="text-red-400 text-xs mt-2 text-center">Couldn&apos;t save — try again.</p>
      )}
      <p className="text-[var(--faint)] text-xs mt-2 text-center">
        Use the same email you&apos;ll sign up with.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
// Match the API's feedback schema so oversized input can't slip through to a
// generic server rejection.
const BODY_MAX = 4000;
const SUBJECT_MAX = 200;
// something@something.tld, no spaces — catches the cases the server's email
// check rejects (whitespace, missing TLD) before we send.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "interested", label: "Interested in Waft" },
];

export default function Contact() {
  const [category, setCategory] = useState("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [bodyInvalid, setBodyInvalid] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);

  async function submit() {
    // Validate client-side so the user gets a clear reason on the offending
    // field instead of a generic server rejection. Email is optional, but if
    // given it must be well-formed (the server rejects whitespace / no TLD).
    const trimmedEmail = email.trim();
    const bodyEmpty = body.trim().length === 0;
    const emailBad = trimmedEmail.length > 0 && !EMAIL_RE.test(trimmedEmail);
    setBodyInvalid(bodyEmpty);
    setEmailInvalid(emailBad);
    if (bodyEmpty || emailBad) {
      setState("idle");
      return;
    }
    setState("sending");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name: name.trim() || undefined,
          email: trimmedEmail || undefined,
          subject: subject.trim() || undefined,
          body: body.trim(),
          website,
        }),
      });
      if (res.ok) {
        setState("sent");
        return;
      }
      setState("error");
      setErrorMsg(
        res.status === 429
          ? "You've sent a few messages already — give it a minute, then try again."
          : "Something went wrong on our end — please try again in a moment."
      );
    } catch {
      setState("error");
      setErrorMsg("Couldn't reach the server — check your connection and try again.");
    }
  }

  const field =
    "w-full rounded-lg border bg-[var(--ground-2)]/60 px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--faint)] focus:border-[var(--border-strong)] outline-none transition-colors";
  const normalBorder = "border-[var(--border)]";
  const nearLimit = body.length > BODY_MAX * 0.9;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-bold mb-2">Get in touch</h1>
        <p className="text-[var(--muted)] mb-8">
          Feedback, a bug, or just want to say hi? Drop a note.
        </p>

        {state === "sent" ? (
          <div className="vapor-card p-6 text-center">
            <p className="font-display text-lg font-semibold">Thanks — got it.</p>
            <p className="text-[var(--muted)] text-sm mt-1">We&apos;ll get back to you if it needs a reply.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer active:scale-[0.97] transition-[transform,border-color,background-color,color] duration-200 ${
                    category === c.value
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent-light)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                className={`${field} ${normalBorder}`}
                placeholder="Name (optional)"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className={`${field} ${emailInvalid ? "border-red-500/70" : normalBorder}`}
                placeholder="Email (optional)"
                type="email"
                maxLength={200}
                aria-invalid={emailInvalid}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailInvalid) setEmailInvalid(false);
                }}
              />
            </div>
            {emailInvalid && (
              <p className="text-red-400 text-xs -mt-2">Enter a valid email, or leave it blank.</p>
            )}
            <input
              className={`${field} ${normalBorder}`}
              placeholder="Subject (optional)"
              maxLength={SUBJECT_MAX}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="message" className="text-sm text-[var(--muted)]">
                  Message <span className="text-[var(--accent)]">*</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${nearLimit ? "text-amber-400" : "text-[var(--faint)]"}`}
                >
                  {body.length}/{BODY_MAX}
                </span>
              </div>
              <textarea
                id="message"
                className={`${field} ${bodyInvalid ? "border-red-500/70" : normalBorder} min-h-[140px] resize-y`}
                placeholder="What's on your mind?"
                maxLength={BODY_MAX}
                aria-invalid={bodyInvalid}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (bodyInvalid && e.target.value.trim().length > 0) setBodyInvalid(false);
                }}
              />
              {bodyInvalid && (
                <p className="text-red-400 text-xs mt-1.5">Add a message before sending.</p>
              )}
            </div>

            {/* honeypot — hidden from humans */}
            <input
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <button
              onClick={submit}
              disabled={state === "sending"}
              className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === "sending" ? "Sending…" : "Send message"}
            </button>
            {state === "error" && (
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

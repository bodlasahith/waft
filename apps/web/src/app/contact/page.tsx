"use client";

import { useState } from "react";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  async function submit() {
    setState("sending");
    try {
      const res = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name: name || undefined,
          email: email || undefined,
          subject: subject || undefined,
          body,
          website,
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  const field =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--ground-2)]/60 px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--faint)] focus:border-[var(--border-strong)] outline-none transition-colors";

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
              <input className={field} placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={field} placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <input className={field} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea
              className={`${field} min-h-[140px] resize-y`}
              placeholder="Your message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
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
              disabled={body.trim().length === 0 || state === "sending"}
              className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === "sending" ? "Sending…" : "Send message"}
            </button>
            {state === "error" && (
              <p className="text-red-400 text-sm text-center">Couldn&apos;t send — try again.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

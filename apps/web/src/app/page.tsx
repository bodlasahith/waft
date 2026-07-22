import { Footer, getWaftHref } from "@/components/Footer";
import { CoalesceLogo } from "@/components/CoalesceLogo";

const STEPS = [
  {
    n: "01",
    title: "Show your QR",
    body: "One card carries every social you choose to share — no more fumbling through “what’s your @”.",
  },
  {
    n: "02",
    title: "They scan it",
    body: "A single scan trades your whole set of handles, across every platform, in seconds.",
  },
  {
    n: "03",
    title: "Watch it grow",
    body: "Every connection settles into your live network graph — the room, made visible.",
  },
];

const hasApp = getWaftHref !== "/";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center px-6">
        <section className="w-full max-w-2xl flex flex-col items-center text-center pt-24 pb-16">
          <h1 className="sr-only">Waft</h1>
          <CoalesceLogo className="w-full max-w-[440px] h-auto -my-6" />
          <p className="reveal reveal-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
            Scan once. Connect everywhere.
          </p>
          <p className="reveal reveal-3 text-[var(--muted)] text-base sm:text-lg max-w-md mt-4 leading-relaxed">
            The phonebook, rebuilt for people whose contacts live across a dozen platforms.
          </p>

          <div className="reveal reveal-4 mt-9">
            {hasApp ? (
              <a href={getWaftHref} className="btn-primary inline-flex px-7 py-3.5 text-[15px]">
                Get Waft on TestFlight
              </a>
            ) : (
              <span className="vapor-card inline-flex items-center gap-2.5 px-5 py-2.5 text-sm text-[var(--muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                Private beta — debuting at YC AI Startup School
              </span>
            )}
          </div>
        </section>

        <section className="w-full max-w-4xl pb-4">
          <p className="reveal reveal-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--faint)] mb-8">
            How it works
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className={`reveal reveal-${i + 5} vapor-card p-6 flex flex-col gap-3`}
              >
                <span className="font-display text-vapor text-3xl font-extrabold tabular-nums">
                  {s.n}
                </span>
                <h3 className="font-display font-semibold text-lg">{s.title}</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {!hasApp && (
          <p className="text-[var(--faint)] text-sm text-center max-w-md pt-10 pb-16">
            Scanned someone’s card? Their links are one tap away — no app needed.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}

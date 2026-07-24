import { Footer, getWaftHref } from "@/components/Footer";
import { CoalesceLogo } from "@/components/CoalesceLogo";

const STEPS = [
  {
    n: "01",
    title: "Show your QR",
    body: "One identity carries every social platform you choose to share.",
  },
  {
    n: "02",
    title: "Scan once",
    body: "A single scan trades your whole set of handles, across every platform, in seconds.",
  },
  {
    n: "03",
    title: "Grow your network",
    body: "Every new waft becomes part of your living social graph.",
  },
];

const hasApp = getWaftHref !== "/";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center px-6">
        {/* HERO */}

        <section className="w-full max-w-3xl flex flex-col items-center text-center pt-24 pb-20">
          <h1 className="sr-only">Waft</h1>

          <CoalesceLogo className="w-full max-w-[440px] h-auto -my-6" />

          <p className="reveal reveal-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-4">
            Scan once. Connect everywhere.
          </p>

          <p className="reveal reveal-3 text-[var(--muted)] text-lg max-w-xl mt-5 leading-relaxed">
            A universal networking identity that lets you share every platform
            you choose with one scan while building a living map of your
            professional relationships.
          </p>

          <div className="reveal reveal-4 mt-10">
            {hasApp ? (
              <a
                href={getWaftHref}
                className="btn-primary inline-flex px-8 py-3.5"
              >
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

        {/* PROBLEM */}

        <section className="w-full max-w-4xl py-20">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold tracking-tight">
              Meeting interesting people has never been easier.
            </h2>

            <h3 className="font-display text-4xl font-bold tracking-tight text-[var(--accent)] mt-2">
              Staying connected with them has.
            </h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-6 text-lg leading-8 text-[var(--muted)]">
            <p>
              At conferences, hackathons, meetups, career fairs, and social
              events, people exchange LinkedIns, Instagrams, Discords, GitHubs,
              X handles, business cards, and phone numbers.
            </p>

            <p>The problem isn't meeting people.</p>

            <p>Everyone simply lives on different platforms.</p>
          </div>

          <div className="vapor-card mt-14 p-8 max-w-2xl mx-auto">
            <div className="space-y-4 font-mono text-sm sm:text-base">
              <p>"What's your Instagram?"</p>

              <p className="text-[var(--muted)]">
                I have one... but I never really use it.
              </p>

              <p>"LinkedIn?"</p>

              <p className="text-[var(--muted)]">
                I check it like once a month.
              </p>

              <p>"Okay... what about X?"</p>

              <p className="text-[var(--muted)]">
                Yeah! I'm on Tech Twitter all the time.
              </p>

              <p>"Sweet... wait... I honestly forgot my username."</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-14 space-y-6 text-lg leading-8 text-[var(--muted)]">
            <p>
              Eventually you exchange <em>something</em>.
            </p>

            <p>But the momentum is gone.</p>

            <p>And a week later...</p>

            <p className="text-white font-medium">
              You barely remember who they were, where you met, or why you
              wanted to stay connected.
            </p>
          </div>
        </section>

        {/* SOLUTION */}

        <section className="w-full max-w-4xl py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-4xl font-bold">
              That's why we built Waft.
            </h2>

            <p className="text-lg leading-8 text-[var(--muted)] mt-8">
              Instead of asking which platform someone prefers, simply share
              your Waft.
            </p>

            <p className="text-lg leading-8 text-[var(--muted)] mt-6">
              One scan instantly shares every platform you choose, letting both
              people connect however feels most natural.
            </p>

            <p className="text-lg leading-8 text-[var(--muted)] mt-6">
              Every interaction then becomes part of your growing professional
              network—preserving where you met, the communities you share, and
              how your relationships evolve over time.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section className="w-full max-w-5xl pb-24">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--faint)] mb-8">
            How it works
          </p>

          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="vapor-card p-7">
                <div className="font-display text-vapor text-4xl font-bold">
                  {s.n}
                </div>

                <h3 className="font-display text-xl mt-4 font-semibold">
                  {s.title}
                </h3>

                <p className="mt-3 text-[var(--muted)] leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* VISION */}

        <section className="w-full max-w-4xl pb-28">
          <div className="text-center">
            <h2 className="font-display text-4xl font-bold">
              Your network isn't a contact list.
            </h2>

            <h2 className="font-display text-4xl font-bold text-[var(--accent)] mt-2">
              It's a living graph.
            </h2>

            <p className="mt-8 text-lg leading-8 text-[var(--muted)] max-w-2xl mx-auto">
              Waft transforms real-world conversations into lasting professional
              relationships by helping you understand not just
              <strong> who you know</strong>, but
              <strong> how you know them</strong>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

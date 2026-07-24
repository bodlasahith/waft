import { Footer, getWaftHref } from "@/components/Footer";

export const metadata = { title: "About — Waft" };

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center px-6">
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

            <ol>
              <li> - Some people live on LinkedIn.</li>
              <li> - Others primarily use Instagram or TikTok.</li>
              <li> - Developers often spend their time on X or GitHub.</li>
              <li> - Some are gamers that run servers Discord.</li>
              <li> - Others are private or simply not online (Phone-only, Telegram).</li>
              <li> - And a great number are just oldheads (like Facebook).</li>
            </ol>

            <p>  The list goes on. Even if two people have several platforms in common, finding the "right" one in the middle goes something like this.</p>
          </div>

          <div className="vapor-card mt-14 p-8 max-w-2xl mx-auto">
            <div className="space-y-4 font-mono text-sm sm:text-base">
              <p>"Hey well it was really nice talking to you! Oh by the way, you got an IG?"</p>

              <p className="text-[var(--muted)]">
                I do have one... but I never really use it though.
              </p>

              <p>"LinkedIn?"</p>

              <p className="text-[var(--muted)]">
                Dude I only check it like once a month. Also, bro we're 2 21-year-old tech bros, why do we need to share Linkedins I ain't gonna DM you there.
              </p>

              <p>"Okay...damn. You got an X?"</p>

              <p className="text-[var(--muted)]">
                Oh yeah! I'm on Tech Twitter all the time!
              </p>

              <p>"Bet... wait shit I lowkey forgot my username, lemme check real quick..."</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-14 space-y-6 text-lg leading-8 text-[var(--muted)]">
            <p>
              Eventually you exchange <em>something</em>.
            </p>
            <p>But the momentum is gone.</p>
            <p>And a week later...</p>

            <p className="text-white font-medium">
              Unless you REALLY hit it off, you barely remember who they were, where you met, or why you wanted to stay connected.
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

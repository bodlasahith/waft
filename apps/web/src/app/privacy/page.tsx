export const metadata = { title: "Privacy — Waft" };

export default function Privacy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-neutral-400 text-sm">Last updated: July 2026 (beta)</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <p className="text-neutral-300">
          When you sign up, we store your email address and the name you choose. If you sign in
          with Google, we receive your name and email from Google. You may optionally add social
          media handles to your card; you choose each one and its visibility. When you connect
          with someone or check into an event, we store that connection — who, when, and at which
          event — because the connection graph is the product.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What others see</h2>
        <p className="text-neutral-300">
          Your public card (name and the socials you marked public) is visible to anyone who
          scans your QR code. Your connections and network graph are visible only to you.
          Event graphs — who checked in and connected at an event — are visible to that
          event&apos;s attendees and on its live wall while the event is active, and expire
          24 hours after the event ends.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we don&apos;t do</h2>
        <p className="text-neutral-300">
          We don&apos;t sell your data, show ads, read your contacts, or track your location.
          Event icebreaker questions are generated from the event&apos;s name only — no personal
          data is sent to AI providers.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Infrastructure</h2>
        <p className="text-neutral-300">
          Data is stored with Supabase (authentication and profiles) and Neo4j Aura (the
          connection graph), and served via Railway and Vercel. Sign-in emails are delivered
          by Resend.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Deleting your data</h2>
        <p className="text-neutral-300">
          Email <a className="underline" href="mailto:bodlasahith@gmail.com">bodlasahith@gmail.com</a>{" "}
          from your account address and we&apos;ll delete your account, card, and connections.
        </p>
      </section>
    </main>
  );
}

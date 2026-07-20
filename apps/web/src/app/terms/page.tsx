import { Footer } from "@/components/Footer";

export const metadata = { title: "Terms — Waft" };

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="max-w-2xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-neutral-400 text-sm">Last updated: July 2026 (beta)</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Using Waft</h2>
          <p className="text-neutral-300">
            Waft is currently in beta. By creating an account you agree to these terms. You must be
            at least 13 years old. You&apos;re responsible for the activity on your account and for
            keeping your sign-in method secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Your content</h2>
          <p className="text-neutral-300">
            You own the profile details, social handles, and other content you add. You grant Waft
            permission to display them as needed to make the product work — for example, showing
            your public card to someone who scans your QR code, or your name in a shared event
            graph. Only add socials and information you&apos;re comfortable sharing in those
            contexts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Acceptable use</h2>
          <p className="text-neutral-300">
            Don&apos;t use Waft to harass, impersonate, spam, scrape other people&apos;s data, or
            break the law. Don&apos;t attempt to disrupt or reverse-engineer the service. We may
            suspend or remove accounts that do.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Beta &amp; availability</h2>
          <p className="text-neutral-300">
            Waft is provided &quot;as is,&quot; without warranties, during the beta. Features may
            change or break, and data isn&apos;t guaranteed to persist. To the extent permitted by
            law, Waft isn&apos;t liable for damages arising from use of the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Ending your use</h2>
          <p className="text-neutral-300">
            You can stop using Waft anytime — email{" "}
            <a className="underline" href="mailto:bodlasahith@gmail.com">bodlasahith@gmail.com</a>{" "}
            to delete your account and data. We may update these terms as the product develops;
            continued use means you accept the changes.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

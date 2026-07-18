const STEPS = [
  { n: "1", title: "Show your QR", body: "One card carries every social you choose to share." },
  { n: "2", title: "They scan it", body: "One scan replaces the whole “what's your @” dance." },
  { n: "3", title: "Watch it grow", body: "Every connection becomes a node in your live network graph." },
];

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 gap-10">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">Waft</h1>
        <p className="text-neutral-400 text-lg max-w-md">
          Scan once. Connect everywhere. See your network grow.
        </p>
        <p className="text-neutral-500 text-sm mt-2 max-w-md">
          The phonebook, rebuilt for people whose contacts live across a dozen platforms.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 max-w-3xl w-full">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-neutral-500 text-sm mb-1">{s.n}</div>
            <div className="font-semibold mb-1">{s.title}</div>
            <p className="text-neutral-400 text-sm">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="text-neutral-500 text-sm text-center max-w-md">
        Waft is in private beta — debuting at YC AI Startup School. Scanned someone&apos;s card?
        Their links are one tap away, no app needed.
      </p>
    </main>
  );
}

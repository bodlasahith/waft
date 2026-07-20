import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-800 py-8 text-center text-sm text-neutral-500">
      <div className="flex items-center justify-center gap-5">
        <Link href="/" className="hover:text-neutral-300">
          Waft
        </Link>
        <Link href="/privacy" className="hover:text-neutral-300">
          Privacy
        </Link>
        <Link href="/contact" className="hover:text-neutral-300">
          Contact
        </Link>
      </div>
      <p className="mt-3 text-neutral-600">© {new Date().getFullYear()} Waft</p>
    </footer>
  );
}

// Where "Get Waft" points. Set NEXT_PUBLIC_TESTFLIGHT_URL in Vercel once the
// public TestFlight link exists; until then the CTA falls back to the landing
// page, which explains the app.
export const getWaftHref = process.env.NEXT_PUBLIC_TESTFLIGHT_URL || "/";

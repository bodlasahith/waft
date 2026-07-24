import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] py-8 text-center text-sm">
      <div className="flex items-center justify-center gap-5">
        <Link href="/" className="link-muted">
          Waft
        </Link>
        <Link href="/about" className="link-muted">
          About
        </Link>
        <Link href="/privacy" className="link-muted">
          Privacy
        </Link>
        <Link href="/terms" className="link-muted">
          Terms
        </Link>
        <Link href="/contact" className="link-muted">
          Contact
        </Link>
      </div>
      <p className="mt-3 text-[var(--faint)]">© {new Date().getFullYear()} Waft</p>
    </footer>
  );
}

// Where "Get Waft" points. Set NEXT_PUBLIC_TESTFLIGHT_URL in Vercel once the
// public TestFlight link exists; until then the CTA falls back to the landing
// page, which explains the app.
export const getWaftHref = process.env.NEXT_PUBLIC_TESTFLIGHT_URL || "/";

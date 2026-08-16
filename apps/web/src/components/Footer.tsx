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

// Where "Get Waft" points. The app is live on the App Store (build 14 approved
// 2026-08), so the permanent listing URL is the default. Override with
// NEXT_PUBLIC_APP_STORE_URL in Vercel if the id ever changes — no code edit
// needed. (The listing only resolves once the version is actually released.)
const APP_STORE_URL = "https://apps.apple.com/app/id6792655313";
export const getWaftHref = process.env.NEXT_PUBLIC_APP_STORE_URL || APP_STORE_URL;

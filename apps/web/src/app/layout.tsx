import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";

// Display harmonizes with the geometric coalesce wordmark; body is a clean
// humanist geometric. Self-hosted by next/font — no external request.
const display = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Waft — scan once, connect everywhere",
  description:
    "The phonebook, rebuilt. One scannable card carries every social you choose to share, and every connection becomes a node in your live network graph.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="vapor-bg" aria-hidden="true">
          <div className="vapor-drift" style={{ top: "-12%", left: "18%" }} />
          <div className="vapor-drift" style={{ bottom: "-16%", right: "8%" }} />
        </div>
        {children}
      </body>
    </html>
  );
}

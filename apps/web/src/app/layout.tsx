import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waft",
  description: "Platform-agnostic social graph for IRL connections",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0d15] text-white antialiased">
        {children}
      </body>
    </html>
  );
}

import { notFound } from "next/navigation";
import { Footer, getWaftHref } from "@/components/Footer";
import { ConnectOnJoin } from "@/components/ConnectOnJoin";

const PLATFORM_META: Record<string, { label: string; color: string; urlPrefix: string }> = {
  instagram: { label: "Instagram", color: "#E1306C", urlPrefix: "https://instagram.com/" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", urlPrefix: "https://linkedin.com/in/" },
  github: { label: "GitHub", color: "#ffffff", urlPrefix: "https://github.com/" },
  x: { label: "X", color: "#ffffff", urlPrefix: "https://x.com/" },
  discord: { label: "Discord", color: "#5865F2", urlPrefix: "" },
  spotify: { label: "Spotify", color: "#1DB954", urlPrefix: "https://open.spotify.com/user/" },
  tiktok: { label: "TikTok", color: "#00f2ea", urlPrefix: "https://tiktok.com/@" },
  reddit: { label: "Reddit", color: "#FF4500", urlPrefix: "https://reddit.com/u/" },
  snapchat: { label: "Snapchat", color: "#FFFC00", urlPrefix: "" },
  facebook: { label: "Facebook", color: "#1877F2", urlPrefix: "https://facebook.com/" },
};

// A social's `url` is user-controlled and Zod's .url() accepts non-web
// schemes (javascript:, data:), which would execute from an <a href> on this
// public page. Only ever emit http(s); otherwise fall back to the platform's
// canonical URL built from the handle, or drop the link entirely.
function safeHref(rawUrl: string | undefined, urlPrefix: string, handle: string): string | null {
  const candidate = rawUrl || (urlPrefix ? `${urlPrefix}${handle}` : "");
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return candidate;
  } catch {
    /* not an absolute URL — fall through */
  }
  return urlPrefix ? `${urlPrefix}${handle}` : null;
}

async function getUserCard(code: string) {
  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/cards/${code}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function CardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getUserCard(code);
  if (!user) notFound();

  return (
    <main className="flex flex-col items-center min-h-screen p-6">
      <div className="flex-1 flex items-center w-full justify-center">
        <div className="vapor-card w-full max-w-sm p-7 shadow-2xl">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-2 ring-[var(--border-strong)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 grid place-items-center bg-[var(--ground-2)] ring-2 ring-[var(--border-strong)]">
              <span className="font-display text-2xl font-extrabold text-vapor">
                {user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-center mb-1">{user.name}</h1>
          <p className="text-center text-xs uppercase tracking-[0.25em] text-[var(--faint)] mb-6">
            wafted to you
          </p>

          <div className="grid grid-cols-3 gap-3">
            {user.socials.map((social: { platform: string; handle: string; url?: string }) => {
              const meta = PLATFORM_META[social.platform];
              if (!meta) return null;
              const href = safeHref(social.url, meta.urlPrefix, social.handle);
              if (!href) return null;
              return (
                <a
                  key={social.platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--ground-2)]/60 hover:border-[var(--border-strong)] active:scale-[0.97] transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  <span
                    className="w-8 h-8 grid place-items-center rounded-full text-sm font-bold font-display"
                    style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
                  >
                    {meta.label.charAt(0)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{meta.label}</span>
                </a>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-col gap-3">
            <ConnectOnJoin cardCode={code} name={user.name} />
            <a href={getWaftHref} className="btn-primary block w-full py-2.5 text-center">
              Get Waft
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

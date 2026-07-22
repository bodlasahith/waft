import { notFound, redirect } from "next/navigation";

// Event QR codes encode getwaft.app/e/<code>. The in-app scanner handles that
// directly (check-in); here we serve everyone else — a camera scan or someone
// opening the memorable link — by resolving the code to the live wall.
async function resolveEvent(code: string) {
  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/events/by-code/${encodeURIComponent(code)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string }>;
}

export default async function EventByCode({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const event = await resolveEvent(code);
  if (!event) notFound();
  redirect(`/event/${event.id}`);
}

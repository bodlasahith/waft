# Waft — Host Outreach Kit

> **Mode matters.** Two gears: **learn** (understand how the host's attendees connect today) and
> **offer** (switch on the wall for their event). The unlock between them is a real **artifact** —
> a ~20s screen-recording of **Event Replay**: an event's network forming from an empty room to a
> fully-connected one, live leaderboard moving as it fills. Lead cold with *learn* ("help me
> understand how your attendees connect today"); the moment a host leans in, send the replay clip
> and *offer*. Don't burn your best rooms on your weakest pitch.
>
> **Pear Prime didn't run — the artifact no longer depends on it.** Generate it yourself from the
> demo event: `npx tsx --env-file=../../.env packages/api/scripts/seed-demo-event.ts` (run
> off the office network — it blocks Aura's 7687 — or Railway-side), then open
> `getwaft.app/e/demoreplay` → **↺ Replay** → **▶** and record. It seeds a ~35-person
> curated-dinner-sized room, which is Waft's exact ICP — so the clip sells the right-sized event,
> not the 6k-person YC wall the kit flags as illegible. `--cleanup` removes it when you're done.

## The ICP (who to target — and who to skip)

Waft's habitat is **networking events, ~30–150 people, where "meet each other" is the point**
and the wall stays legible / full-room adoption is achievable.

| ✅ Target | ❌ Skip (wrong ICP) |
|---|---|
| Founder / VC dinners, curated | Weddings, birthdays, personal parties |
| Tech meetups, AI builder nights | Concerts, club nights (Dice/Shotgun core) |
| Hackathons, demo days | Anything > ~300 people (wall illegible — see YC SUS 6k) |
| Alumni / community mixers | Ticketing-first events (you're not RSVP) |
| Accelerator / cohort events | |

**Platform sort:** **Luma is the one** — it *is* the platform for the tech/networking events
that are Waft's habitat. Partiful/Posh are secondary (mixed social/nightlife). Evite,
Paperless Post, Punchbowl, Apple Invites, Facebook Events = personal parties → skip.

## Target list (SF, live communities)

Tier 1 — **large recurring communities** (many events, one host relationship = repeat rooms):
- **Bay Area Founders Club** — `luma.com/bayareafoundersclub` (50K+ members, VCs, private dinners)
- **Founders Bay** — `luma.com/foundersbay` (150K+ AI founders/builders, weekly curated events)
- **Tech2table** — small, curated founder/investor dinners (1,000+ alumni; "small & curated" is stated policy — ideal Waft size)

Tier 2 — **the sweet spot: intimate curated dinners** (30–150, full-room adoption realistic):
- Search-and-apply flow, not a fixed list — these turn over weekly. Find them via ⬇.

**How to find fresh targets each week:**
- **`hiddenevents.online/sf`** — aggregates *all* SF Luma tech events (claims ~91% are unlisted / hidden from Luma's featured page). Best single discovery surface.
- **`luma.com/discover`** — Luma's own browse, filtered to SF + tech/AI.
- **Tech Week SF (Oct 5–11, 2026)** — hundreds of individually-hosted events in one week; a concentrated hunting ground for hosts. Line up ahead.

## Outreach templates

### A. Discovery-mode DM (before Pear artifact) — lead with learning
> Hi [name] — I saw you run [event]. I'm a founder working on how people exchange contacts
> at events (the "what's your Instagram" dance), and I'm trying to learn from organizers who
> actually do this well. Could I ask you 3 quick questions about how you help attendees connect
> today? Not selling anything — genuinely just learning. 10 min, whenever's easy.

### B. Offer-mode: the wall as a free add-on (once you have the replay clip) — do things that don't scale
> Hi [name] — I run **Waft**, a live networking layer for events. Attendees scan one QR, instantly
> trade whatever socials they actually use, and the room's connections appear on a live graph on
> screen — with AI icebreakers themed to your event.
>
> Here's a 20-second look at a room connecting → [replay clip]. It plays back the network forming
> from empty to full; live, that happens on a projected wall as people arrive.
>
> Would you be open to switching it on for [their event] as a free add-on? Zero setup for you —
> a QR on the tables + any screen for the wall. Totally opt-in for attendees. I'd love to make
> your next event's networking the thing people remember.

### C. Cold email to a community (org-level, once you have the replay clip)
> Subject: A live networking layer for [community]'s events
>
> Hi [name], [community] is exactly the kind of room Waft is built for — [N] people who came to
> meet each other. Waft turns that into one scan → instant contact exchange → a live graph of the
> room on screen, plus AI icebreakers themed to your event.
>
> Here's a 20-second replay of a room connecting → [replay clip]. One integration = every event
> you run. Could I run it free at your next one?

> **The [replay clip] link:** upload your recording (Loom / YouTube-unlisted / a hosted MP4) and
> paste that URL. Keep it to the ~20s empty→full arc + the leaderboard — that's the whole hook.

## Tracking

| Host / community | Platform | Contact | Mode (learn/offer) | Sent | Reply | Outcome |
|---|---|---|---|---|---|---|
| Pear VC (Nate) | direct | email thread | offer (Prime Day sim) | 2026-07 | no reply | **lapsed — demo didn't run; artifact now from Replay instead** |
| Bay Area Founders Club | Luma | — | offer (draft ready) | — | — | — |
| Founders Bay | Luma | — | offer (draft ready) | — | — | — |
| Tech2table | Luma | — | offer (draft ready) | — | — | — |

## The one metric that matters

Not "how many did I email." It's: **which host or attendee leaned forward?** One organizer who
says "yes, do it at my next event" > 200 non-replies. Find the lean-forward; that's your first
real customer and the answer to host-vs-individual.

_Sources: Luma community pages (bayareafoundersclub, foundersbay), hiddenevents.online/sf,
Tech Week SF. Compiled 2026-07._

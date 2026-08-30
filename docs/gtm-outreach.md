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
> **Live clip (now embedded in all 9 drafts):** https://youtu.be/4ROvp0N1QEE (YouTube, unlisted).

## Cold-email playbook (research-backed, 2026)

What moves reply rate for *this* motion — offering a free add-on to organizers (a partnership ask, not
a SaaS sale), from 2026 benchmarks ([GetReplies](https://getreplies.ai/blog/cold-email-templates-2026/),
[Tomba](https://tomba.io/blog/cold-email-for-business-partnership)):
- **50–125 words.** Short emails reply ~50% better — cut everything non-essential.
- **Signal personalization** — name their specific/recurring event in line 1. Signal-based ≈18% reply vs
  ≈3.4% generic.
- **Fair trade + one small ask.** Offer value (free wall, zero setup) and ask one low-friction next step
  ("could I run it free at your next X?"). Don't "sell."
- **Curiosity subject** — "Watch [their room] connect in real time" beats "A live networking layer for X."
- **P.S. line** — high-read real estate; reinforce zero-risk.
- **Follow up: 3–4 touches, 3–5 days apart, multichannel** (email → LinkedIn/X DM). Most replies land on
  touch 2–3; widen the gaps later.

### Canonical offer template (tight — the new default)
> Subject: **Watch [their event] connect in real time**
>
> Hi there,
> [Their event] is exactly the room Waft is built for — [one phrase why]. Guests scan one QR, instantly
> swap whatever socials they use, and the room's connections form a live graph on screen, with AI
> icebreakers themed to the [event].
>
> 20-second look → [replay clip].
>
> Could I run it free at an upcoming [event]? Zero setup — a QR on the tables, any screen for the wall,
> opt-in for guests.
>
> — Sahith
> getwaft.app
>
> P.S. — guests join in ~10 seconds, nothing to install.

### P.S. bank (rotate to A/B)
- P.S. — guests join in ~10 seconds, nothing to install.
- P.S. — happy to show you the 2-minute version first, no commitment.
- P.S. — you keep the graph after — a nice recap to share with attendees.

**Applied:** all 9 offer drafts (Hacker Dojo, SF Founder Dinner, SURF Incubator, Bay Area Founders Club,
Founders Bay, Tech2table, Frontier Tower, 9Zero, New Tech Northwest) now use this tight copy + curiosity
subject + P.S.

### Follow-up sequence (most replies land here, not on touch 1)

Send follow-ups **in the same email thread** (reply, same subject), 3–5 days apart. If email touch 1–2
gets no reply, switch to **LinkedIn/X DM** for touch 3 — multichannel lifts reply rate. Stop after touch 3.

**Touch 2 — +3–4 days (short bump):**
> Hi there — bumping this in case it got buried. Short version: one QR scan turns [their event] into a
> live connection graph on screen — free, zero setup, opt-in for guests. 20-sec look →
> https://youtu.be/4ROvp0N1QEE. Worth a quick try at your next one?
> — Sahith

**Touch 3 — +4–5 days (soft close + learn pivot):**
> Hi there — last nudge, then I'll leave you be. Even if the wall isn't a fit, I'd genuinely love to hear
> how you get [their event]'s guests connecting today — always learning from organizers who do it well.
> And if you're up for trying it, I'll set the whole thing up so it's zero lift on your end.
> — Sahith

Touch 3 deliberately blends a breakup with the Mom-Test question: it either revives the offer or pivots to
a discovery conversation (which is worth just as much pre-launch).

### Short DM versions (LinkedIn/X/form channels — 2–3 sentences, clip inline)

**Hacker Dojo** (X `@hackerdojo` / "Request an Event" form):
> Hey! I've been to a couple Hacker Dojo events (Startups Mix & Pitch, Game Night). I built Waft — guests scan one QR and the room's connections form a live graph on screen, with AI icebreakers. 20-sec look → youtu.be/4ROvp0N1QEE. Could I run it free at the next Founders Pitch night? Zero setup on your end.

**SF Founder Dinner** (Karen Sheffield — X `@kar_n_twitts` / LinkedIn):
> Hi Karen — saw your SF Founder Dinner sold out. I built Waft: guests scan one QR and the table's connections form a live graph on screen, with AI icebreakers themed to the dinner. 20-sec look → youtu.be/4ROvp0N1QEE. Could I run it free at your next dinner? Zero setup on your end.

**Founders Bay** (Mariane Bekker — LinkedIn `in/marianebekker` / X `@marianebekker`):
> Hi Mariane — Founders Bay's weekly events are exactly the room Waft is built for. Guests scan one QR and the room's connections form a live graph on screen, with AI icebreakers. 20-sec look → youtu.be/4ROvp0N1QEE. Could I run it free at your next one? Since you run weekly, one setup covers them all.

**New Tech NW** (contact form / IG `@newtechnw` / LinkedIn):
> Hi! New Tech Seattle is exactly the room Waft is built for — a monthly crowd who show up to meet each other. Guests scan one QR and the room's connections form a live graph on screen, with AI icebreakers. 20-sec look → youtu.be/4ROvp0N1QEE. Could I run it free at an upcoming meetup? Zero setup on your end.

### LinkedIn round (touch 2 — reach the human behind each org; send MANUALLY)

Multichannel lifts reply rate, and LinkedIn reaches the decision-maker (emails went to `contact@`/`hello@`).
**Manual only — LinkedIn aggressively bans automation, and a personal request from you lands far better.**
Play: **connection request + note (≤300 chars, NO link** — links tank acceptance), then DM the pitch + clip
once they accept. You can't DM a non-connection without Premium/InMail. Keep to ~15–20 requests/day.

Targets (the people behind the emailed orgs) — **all profile URLs confirmed via LinkedIn search 2026-08-29;
all are 2nd-degree with shared mutuals, so a connection request + note will land** (send from your account):
- **Dr. Paul Fang** (Bay Area Founders Club) → `linkedin.com/in/paul-fang-phd/` — "Founder @ Bay Area Founders Club (100K+)", Los Altos, 13+ mutuals, 20K followers.
- **David Lam** (Tech2table founder) → `linkedin.com/in/davidlam07/` — now also Co-Founder/CEO at Abacor (NYC-based); still lists Tech2Table. 10K followers.
- **Mariane Bekker** (Founders Bay) → `linkedin.com/in/marianebekker/` — "Founder & Investor @ Founders Bay - 250k community" / Head of DevRel @ You.com, SF, 5 mutuals, 30K followers. (Slug confirmed.)
- **Karen Sheffield, MBA** (SF Founder Dinner / Pachamama) → `linkedin.com/in/karen-sheffield/` — "Founder & Managing Partner at Pachamama Ventures", SF Bay, 18K followers.
- **New Tech Northwest** — organizer NOT confirmable on LinkedIn (the "Thomas Kim" guess didn't verify; a generic search returned noise). Reach via org channels instead: `newtechnorthwest.com/contact-us/`, IG `@newtechnw`, or Luma "Contact the Host" on `luma.com/newtech`. Don't address a specific name until confirmed.

**Connection notes (≤300 chars, no link):**
- *Paul Fang:* Hi Paul — I run Waft, a live networking layer for events: one QR scan and the room's connections form a live graph on screen. Bay Area Founders Club dinners are exactly the room it's built for. Would love to connect and show you a 20-sec look — a fun, zero-setup add-on.
- *David Lam:* Hi David — I run Waft, a live networking layer for events: guests scan one QR and the room's connections form a live graph on screen. Tech2table's curated dinners are the perfect fit. Would love to connect and share a 20-sec look — zero setup on your end.
- *Mariane Bekker:* Hi Mariane — I reached out via your Luma about Waft (a live networking graph for events) and wanted to connect here too. Founders Bay is exactly the room it's built for. Happy to show a 20-sec look — could be a fun add-on for a weekly event.
- *Karen Sheffield:* Hi Karen — messaged via your SF Founder Dinner Luma about Waft (live networking graph for events) and wanted to connect here too. A curated founder table is exactly its habitat. Happy to show a 20-sec look — zero setup on your end.
- *Thomas Kim:* Hi Thomas — reached out via New Tech's Luma about Waft: one QR scan and the room's connections form a live graph on screen. New Tech Seattle is exactly the room it's built for. Would love to connect and show a 20-sec look.

**Post-accept DM (clip goes here):**
> Thanks for connecting, [name]! Here's the 20-sec look → youtu.be/4ROvp0N1QEE — guests scan one QR and the room's connections form a live graph on screen, with AI icebreakers themed to the event. Could I run it free at an upcoming [their event]? Zero setup on your end — a QR on the tables + any screen. (P.S. — Waft's now live on the App Store.)

### Email touch 2 (bumps — 5 drafts queued in Gmail, subject "Re: …")

Short same-thread bumps for the 5 email targets (9Zero, SURF, Frontier Tower, Bay Area Founders Club, Tech2table).
⚠️ **These + the App Store link point at the live app — hold sending until the Railway backend is up (see below),**
or you're driving prospects to a broken product.

## Master target list (prioritized — the working email list)

Ordered by priority. **P1** = email first (ICP-perfect and/or warm, contact in hand, draft written).
**P2** = strong recurring hosts, contact known or one drill away. **P3** = secondary/larger/niche.
Contact = the public channel to reach the host (org site's contact page, or Luma "Contact the Host").
No raw emails exist on Luma — use the site contact form / a `hello@`·`info@` on the org site.

| # | Priority | Organizer | Metro | Why it fits (ICP) | Contact | Draft |
|---|---|---|---|---|---|---|
| 1 | **P1** | **Hacker Dojo** | SF/Bay | Recurring host, 218 events; founder pitch + mixer. **Warm** (Sahith attended). Aug-12 Founders Pitch night `luma.com/m0eu7bw9` | `hackerdojo.org`, X `@hackerdojo`, `luma.com/user/Hacker_Dojo` | ✅ offer |
| 2 | **P1** | **SF Founder Dinner** (Karen Sheffield / Pachamama Ventures) | SF | Curated founder dinner, sold out (demand proven) — Tech2table-class | `pachamamavc.com`, X `@kar_n_twitts` | ✅ offer |
| 3 | **P1** | **SURF Incubator** | Seattle | Recurring weekly "Startups in Action" mixer | `surfincubator.com`, IG/LinkedIn `@surfincubator`, `luma.com/surfincubator` | ✅ offer |
| 4 | P2 | **Startup Walk & Talk @ Green Lake** | Seattle | "Founders & Investors Only" — small, curated → ICP-perfect | Luma event → Contact the Host (drill) | — |
| 5 | P2 | **Bay Area Founders Club** | SF/Bay | Curated founder/VC dinners, 50k+ members | `luma.com/bayareafoundersclub` | ✅ offer+learn |
| 6 | P2 | **Founders Bay** | SF/Bay | Weekly curated AI-founder events | `foundersbay.com`, `luma.com/foundersbay` | ✅ offer+learn |
| 7 | P2 | **Tech2table** | SF/Bay | Small curated founder/investor dinners (stated policy) | `luma.com` (find calendar) | ✅ offer+learn |
| 8 | P2 | **Frontier Tower SF** | SF | 16-floor frontier-tech hub → steady event stream from one relationship | `frontiertower.io/apply` | ✅ offer |
| 9 | P2 | **[SF] HackerSquad** | SF | Builder-first community, recurring build/speaker nights | Luma calendar (drill) | — |
| 10 | P2 | **9Zero** | Seattle | Climate Innovation Hub; Founder Peer Group Meetups (small, curated) | `9zero.com`, `luma.com/9ZeroSeattle`, LinkedIn `9zero-climate`, IG `@9zero_climatehub` | ✅ offer |
| 11 | P2 | **New Tech Northwest** | Seattle | "New Tech Seattle," recurring monthly meetup (~60+) | `newtechnorthwest.com`, `luma.com/newtech`, LinkedIn `company/2845745` | ✅ offer |
| 12 | P3 | **Big Brain Lectures – Bay Area** | SF/Bay | Recurring lecture series in curated spaces | Luma calendar (drill) | — |
| 13 | P3 | **Build with Claude** (w/ Provectus) | SF | Recurring Claude Code workshops, small/hands-on | Luma event (drill) | — |
| 14 | P3 | **thinkspace SEATTLE** | Seattle | Coworking/incubator; founder workshops | Luma calendar (drill) | — |
| 15 | P3 | **tiat** | SF | Art × technology recurring calendar (niche) | Luma calendar (drill) | — |
| 16 | P3 | **Founders on Tap** | SF/Bay | Recurring founder-networking host (YC afterparty) | Luma calendar (drill) | — |
| — | skip | Bond AI (130k), SF Hardware Meetup (10.5k) | SF/Bay | Recurring but events likely exceed the wall's legible size (>~300) | `bondcommunity.ai` | — |

**Drafted so far (offer, in Gmail):** #1 Hacker Dojo, #2 SF Founder Dinner, #3 SURF Incubator, #5 Bay Area
Founders Club, #6 Founders Bay, #7 Tech2table, #8 Frontier Tower, #10 9Zero, #11 New Tech Northwest — 9
targets. **Still to drill/draft:** #4 Startup Walk & Talk, #9 [SF] HackerSquad, #12–16 (thinkspace's Luma
event page wouldn't load — retry later). All drafts need the recorded **[replay clip]** URL + a recipient
from the contact column before sending. Also line up **SF Tech Week (Oct 5–11)** hosts as they publish.

### Send channels (drilled from org sites, 2026-08-12)

**Direct email (send the offer draft here):**
- **9Zero** → `seattle@9zero.com` (Seattle team; `teamsf@9zero.com` for SF)
- **SURF Incubator** → `booking@surfincubator.com` (handles events/bookings)
- **Frontier Tower** → `support@frontiertower.io`
- **Bay Area Founders Club** → `contact@bayareafoundersclub.com` (their /contact form is literally "how you'd like to collaborate with BFC"; founder Dr. Paul Fang)
- **Tech2table** → `hello@jointech2table.com` (founder David Lam)

**No public email — use the channel (offer draft becomes a short DM / form message):**
- **Hacker Dojo** → their **"Request an Event" Google form** (they explicitly take event requests), or DM X `@hackerdojo`. Warm angle still applies (Sahith attended).
- **Pachamama / SF Founder Dinner** → reach Karen Sheffield via X `@kar_n_twitts` or LinkedIn `company/pachamamaventures` (no general email).
- **Founders Bay** → founder **Mariane Bekker** via LinkedIn `in/marianebekker` / X `@marianebekker`, or Luma "Contact the Host" on `luma.com/foundersbay`.
- **New Tech Northwest** → site blocks fetch; use their contact page `newtechnorthwest.com/contact-us/`, IG `@newtechnw`, or LinkedIn `company/newtechnorthwest`, or Luma "Contact the Host" on `luma.com/newtech`. (NB: Jim Newkirk is a *presenter*, not the organizer — don't address him.)

For the DM/form channels, trim the offer email to ~2 sentences + the replay-clip link (long emails read as spam in a DM).

## Tracking

| Host / community | Platform | Contact | Mode (learn/offer) | Sent | Reply | Outcome |
|---|---|---|---|---|---|---|
| Pear VC (Nate) | direct | email thread | offer (Prime Day sim) | 2026-07 | no reply | **lapsed — demo didn't run; artifact now from Replay instead** |
| **9Zero** | email | seattle@9zero.com | offer | **2026-08-12** | ⏳ pending | touch 2 due ~8/15–16 |
| **SURF Incubator** | email | booking@surfincubator.com | offer | **2026-08-12** | ⏳ pending | touch 2 due ~8/15–16 |
| **Frontier Tower** | email | support@frontiertower.io | offer | **2026-08-12** | ⏳ pending | touch 2 due ~8/15–16 |
| **Bay Area Founders Club** | email | contact@bayareafoundersclub.com | offer | **2026-08-15** | ⏳ pending | touch 2 ~8/18–19 |
| **Founders Bay** | Luma DM | Contact-Host → Mariane Bekker | offer | **2026-08-12** | ⏳ pending | sent via Luma; touch 2 ~8/15–16 |
| **New Tech Northwest** | Luma DM | Contact-Host → NTNW / Thomas Kim | offer | **2026-08-12** | ⏳ pending | **touch 2 sent 2026-08-30** via Contact-Host on the Sep 15 "New Tech Seattle" meetup (Thomas Kim confirmed as co-host) |
| **SF Founder Dinner** (Pachamama) | Luma DM | Contact-Host → Karen Sheffield | offer | **2026-08-12** | ⏳ pending | sent via Luma; touch 2 ~8/15–16 |
| **Tech2table** | email | hello@jointech2table.com | offer | **2026-08-15** | ⏳ pending | touch 2 ~8/18–19 |
| **Hacker Dojo** | Luma DM | Contact-Host → Hacker Dojo team | offer (warm — Sahith attended) | **2026-08-12** | ⏳ pending | **touch 2 sent 2026-08-30** via Contact-Host on the Sep 1 "Bay Area Founder Networking & Startup Workshop" (co-hosted w/ StartupA2Z / satish govindappa, 93 going — perfect ICP) |
| **StartupA2Z** (satish govindappa) | Luma DM | Contact-Host (Sep 1 founder-networking event) | offer | **2026-08-30** | ⏳ pending | reached via the co-hosted Hacker Dojo event; net-new host worth tracking separately |
| Founders on Tap | Luma | (find handle — YC afterparty host) | offer | — | — | recurring founder-networking host |

### Warm targets from Sahith's own Luma (triaged 2026-08-10)

**Reality check on "getting organizer emails": Luma does not expose them.** A host is
reachable via (1) the in-app **"Contact the Host"** button and (2) their **public host page**
(`luma.com/user/<handle>`), which links their site + socials. So outreach = a named host + their
public business contact, not a scraped address list. The strongest fit from the account:

- **Hacker Dojo** (`luma.com/user/Hacker_Dojo`, `hackerdojo.org`) — a Silicon Valley community space,
  **218 events hosted**, running exactly Waft's rooms (founder pitch + open mixer). Sahith has been
  invited to theirs (warm). **Live upcoming ICP target: "Bay Area Founders Pitch & Startup Networking",
  Wed Aug 12 → `luma.com/m0eu7bw9`.** Best first move: reach out re: running the wall at that event,
  via hackerdojo.org's contact or their Luma "Contact the Host".
- Most of the rest of the account is YC-Startup-School-weekend afterparties (Jul 25–26): large, one-off,
  wrong-ICP (600–2K attendees, illegible walls). Skip those; mine the recurring hosts instead.

#### Luma `/tech` + city-page sweep (2026-08-10) — recurring ICP hosts, both metros

Contact for all of these = their **Luma host/calendar page** ("Contact the Host") + any linked site/socials
(no raw emails on Luma). Prioritize **recurring** hosts — one yes = many rooms. Filter out the big ones
(>~300 → illegible wall).

**San Francisco / Bay Area** (`luma.com/sf`):
- **SF Founder Dinner** — Karen Sheffield / Pachamama Ventures (VC). Curated founder dinner, **ICP-perfect**
  (sold out — demand proven). A Tech2table-class target. Contact: `pachamamavc.com`, X `@kar_n_twitts`,
  `luma.com/user/usr-zdaRMmEO6PcpV7C`. (Co-hosts: Mariane Bekker, Puya Vossoughi; Mercury sponsors.)
- **[SF] HackerSquad** (ex-[SF] Builders Collective) — builder-first community, recurring speaker/build nights.
- **Frontier Tower SF** (`frontiertower.io/apply`) — 16-floor frontier-tech hub hosting many events; a venue
  relationship = a steady event stream.
- **Big Brain Lectures – Bay Area** — recurring lecture series in curated spaces.
- **Build with Claude** (w/ Provectus) — recurring Claude Code workshops @ Embarcadero (small, hands-on).
- **tiat** — art × technology recurring calendar (niche but curated).
- Larger community calendars (lower priority — events may exceed the wall's legible size): **Bond AI** (130k
  members, `bondcommunity.ai`), **SF Hardware Meetup** (10.5k, monthly).

**Seattle** (`luma.com/tech`, geolocated there):
- **Startup Walk & Talk @ Green Lake** — "Founders & Investors Only." Small + curated → **ICP-perfect**.
- **SURF Incubator** — "Wednesday Startups in Action Social," recurring weekly mixer. Contact:
  `surfincubator.com`, IG `@surfincubator`, LinkedIn `company/surf-incubator`, `luma.com/surfincubator`.
- **9Zero** (Climate Innovation Hub) — Founder Peer Group Meetup, small curated group.
- **thinkspace SEATTLE** — recurring founder workshops (GTM Strategy Basics).
- **New Tech Northwest** — "New Tech Seattle," recurring monthly meetup (~60+).

**Also on `/tech`:** the **Tech Week** umbrellas are the highest-density hunting grounds — **SF Tech Week
Oct 5–11** (hundreds of individually-hosted events; "Launching Soon"), Grand Rapids (Sep 14–19), Austin
(Oct 26–30). Line these up ahead of time (kit already flags SF Tech Week).

## New targets — Luma `/ai` + LinkedIn discovery run (2026-08-29)

The `/sf` "popular" feed is noise (yoga, journaling, nightlife). **Luma `/ai` is the high-signal surface** —
its **Popular Calendars** are *recurring communities* (one host relationship = many rooms), which beats any
one-off event. New recurring-host targets, best-fit first. Contact route for all = each calendar's Luma page
→ **"Contact the Host"** (no raw emails on Luma), plus the org site/socials noted.

| Target | Luma / link | Why it fits (ICP) | Fit | Contact route |
|---|---|---|---|---|
| **Llama Lounge** — SF AI Startup Series | `luma.com/llamalounge` | SF AI-startup **demo series** (since Apr 2023) — demos + networking, curated | ★★★ strong | Luma Contact-Host; find organizer on site |
| **GenAI Collective** ("The AI Collective") | `luma.com/genai-collective` | 200k+ community **with local SF chapter mixers** — target the SF chapter events (skip the mega ones) | ★★★ strong (chapter-level) | Luma Contact-Host on SF chapter events |
| **AICamp** (Guava Voice AI Hackathon host) | event `luma.com/678a9u02`, venue "House of AI" | Recurring AI **build nights / meetups**, 150+ RSVPs — big reach, networking-forward | ★★☆ | Luma Contact-Host; `aicamp.ai` |
| **Latent.Space** (swyx / Shawn Wang) | `luma.com/ls` | Paper Club + "AI in Action" meetups — smaller sessions fit; **swyx is very reachable on X** | ★★☆ (meetups, not confs) | X `@swyx`; Luma Contact-Host |
| **Sundai Club / RSI House** | `sundai.club`, `rsihouse.ai`, event `luma.com/7cacs0ez` | Harvard/MIT AI hacker community, **every Sunday** in SF (130+ hacks). Builder-heavy (heads-down) but weekly intros/team-formation = contact exchange | ★★☆ builder-focused | Hosts: Serge `@sergeicu`, Sean Klein `@its_sean_klein`; sundai.club |

**Also-rans seen (lower priority):** Air Street events (`luma.com/airstreet` — VC-run, likely large), OpenClaw
Meetups (`luma.com/claw`), Claude Community Events (`luma.com/claudecommunity`). Weekend `/ai` feed was
hackathon-heavy (Himalaya Robotics `/qa11srwr`, Halluminate Research Rave `/2yoy4m46`) — hacks are too
soon/heads-down to pitch a specific instance; mine the **recurring calendar** behind each instead.

**New person target (LinkedIn):** **Steven Echtman** — "AI Ecosystem / DevRel / Community Leader; Founder
ClawCamp; SF Chapter Lead, AGI Society; SF Tech Week", SF, 13K followers, 2nd-degree. Runs SF AI community
events → worth a connection request on the same play as the org founders above.

**How to reach any new calendar:** open its Luma page → **"Contact the Host"** (same channel that worked for
the touch-1 Luma DMs). I can send these via the browser with your per-message approval, same as before.

### Broadened LinkedIn organizer pool (2026-08-29) — for reach

Cold DMs get ignored, so we need volume — BUT **LinkedIn free-tier caps personalized-note invites at ~5/month**
and throttles total invites (~100–200/wk, flagged sooner if spammy). So don't blast notes. Spend the scarce
note-invites on the ★★★ tier; send **no-note** requests to the rest (doesn't burn the 5/mo note budget) and DM
after they accept; **Follow + comment** on 3rd-degree folks for impressions without spending an invite. All
found via ICP keyword searches ("AI events organizer / hackathon host / community builder", SF + Seattle).

**Tier A — spend note-invites here (★★★, mostly 2nd-degree, strong ICP):**
| Name | Profile | Why | Degree |
|---|---|---|---|
| **Daniel Monteverde** | `/in/danielmonteverde/` | Founder @ dinnerHQ — "meet professionals over dinner"; **1st-degree → DM directly, no invite** | 1st ✅ |
| **Kuzma Ledenev** | `/in/kuzma-ledenev-37b00063/` | "AI Events for founders, investors & engineers in SF Bay Area" — bullseye | 2nd |
| **TatianaSF** | `/in/tatianasf/` | Founder, HackathonSF; SF ecosystem GTM, 4+ mutuals, 16K | 2nd |
| **Filip Graniczny** | `/in/filipgraniczny/` | Tech Week @ a16z (hundreds of events) | 2nd |
| **Mustafa Khan** | `/in/mustafakhan/` | Head of Events @ Clay + Lenny Rachitsky's Summit producer + Daybreaker SF founder | 2nd |

**Tier B — no-note connection request, then DM on accept (★★, 2nd-degree):**
| Name | Profile | Why |
|---|---|---|
| **Aisha Asanova** | `/in/aisha-asanova/` | Founder Community Builder \| AI/ML Program Leader, SF |
| **Alison Granger Ganansia** | `/in/alison-granger-ganansia/` | "Building Blooming" — event strategy & community growth, SF |
| **Josue Cruz** | `/in/j-crz/` | DevRel/Community; Outreach Chair @ SF Hacks |
| **Laura Knaub** | `/in/laura-knaub-0239216/` | Community, Operations & Events Manager, Seattle |
| **Audrey Yun** | `/in/audsyun/` | Events & Community Mgr @ AI House (Seattle's AI Hub / AI2 Incubator) — Seattle ICP ★★★ but 3rd-deg |

**Tier C — Follow + comment for impressions (3rd-degree / niche):** Catherine Cheng `/in/catherinecheng2022/`
("I host unforgettable IRL experiences"), Jeremy J. Lynch `/in/jeremyjlynch/` (AI Community Builder / Event
Innovator), Emily Fang `/in/emilyfang/` (Developer Events @ Workato), Caitlin Maltbie `/in/caitlinmaltbie/`
(OpenAI Forum events). Plus **Steven Echtman** (ClawCamp / AGI Society SF / SF Tech Week — search by name; 2nd,
13K) and **Ami Arad** (B2B Executive Dinners founder — search "Ami Arad dinner"; 2nd) — borderline, verify fit.

**Cold connection note (these hosts weren't emailed — adapt per person, ≤300 chars, NO link):**
> Hi [name] — I run Waft, a live networking layer for events: guests scan one QR and the room's connections
> form a live graph on screen, with AI icebreakers. [Their event/community] looks exactly like the room it's
> built for. Would love to connect and show you a 20-sec look — a fun, zero-setup add-on.

Then, once connected (or immediately for 1st-degree Daniel): the **Post-accept DM** above (clip + offer + "live
on the App Store").

## The one metric that matters

Not "how many did I email." It's: **which host or attendee leaned forward?** One organizer who
says "yes, do it at my next event" > 200 non-replies. Find the lean-forward; that's your first
real customer and the answer to host-vs-individual.

_Sources: Luma community pages (bayareafoundersclub, foundersbay), hiddenevents.online/sf,
Tech Week SF. Compiled 2026-07._

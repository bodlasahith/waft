# Waft

**Platform-agnostic social graph for IRL connections.**

Scan once. Connect everywhere. See your network grow.

---

## What is Waft?

Waft replaces the awkward "What's your Instagram?" exchange at events with a single QR scan that surfaces all of a person's linked socials at once. The person scanning taps whichever platform *they* use — no negotiation, no missed connections across generational or professional divides.

Every connection forms an edge in a live graph visualization. Over time, users see their network topology — clusters, bridges, mutual connections — rather than a flat contact list.

**Positioning direction** (slogan TBD): Waft is *the new phonebook* — the
rolodex reinvented for people whose contacts live across a dozen platforms.
Candidate framings to workshop: "your people, one graph" / "the phonebook,
rebuilt for how you actually keep in touch" / "scan once, never lose anyone
again".

## Problem

1. **Platform fragmentation** — Young people share Instagram/TikTok/Snapchat, professionals share LinkedIn/X, gamers share Discord. At events with mixed demographics, there's no single "connect" action that works for everyone.
2. **Post-event amnesia** — You meet 20 people at a conference and remember 3. The rest are lost.
3. **Linktree friction** — QR → browser → scroll a list → tap one link → redirect → follow → back → repeat. 5+ taps per platform.
4. **No relationship structure** — Contact lists are flat. You can't see *how* people are connected, who bridges your clusters, or who you should meet next.

## Solution

- **One QR scan** replaces per-platform handle exchange
- **Web card fallback** means the person scanning doesn't need the app (zero-friction acquisition)
- **Graph visualization** shows network topology, not just a list
- **Event rooms** create time-bounded subgraphs with live visualization
- **Group creation** turns graph clusters into group chats on Discord, Telegram, iMessage, WhatsApp, or Slack with one tap
- **Progressive profile** — sign up in 15 seconds (Apple/Google auth), add socials over time as motivation arises

## Target Use Case

**Events, meetups, and conferences** — where people are concentrated, motivated to connect, and currently underserved by existing tools.

Initial launch strategy: deploy at YC AI Startup School and similar tech events where QR-scanning is already habitual behavior.

## Key Differentiators vs. Existing Products

| Competitor | What they do | What they don't do |
|-----------|-------------|-------------------|
| **Popl / Blinq / HiHello** | Digital business cards, lead capture | No graph visualization, pivoted to enterprise B2B |
| **Swapcard / Grip** | AI matchmaking for large conferences | No consumer product, no visualization, list-based |
| **Linktree** | All links in one page | No event context, no connections, no graph, high tap-friction |
| **Luma** | Event RSVPs and hosting | No post-event networking or relationship mapping |

**Gap:** Nobody combines QR-based contact exchange with graph visualization. The graph is genuinely novel in this space.

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile app | React Native (Expo) |
| Web (QR card + event graph) | Next.js + Tailwind CSS |
| API | Fastify (Node.js/TypeScript) |
| Graph database | Neo4j Aura |
| Relational database | Postgres (Supabase) |
| Auth | Supabase Auth (Apple/Google sign-in) |
| Graph visualization | Sigma.js + Graphology |
| Real-time | WebSocket |

### Monorepo Structure

```
waft/
├── apps/
│   ├── mobile/              # React Native (Expo) — QR scanner, profile, graph view
│   └── web/                 # Next.js — QR card fallback, live event graph dashboard
├── packages/
│   ├── api/                 # Fastify — REST + WebSocket server
│   │   └── src/
│   │       ├── routes/      # connections, events, users, groups
│   │       ├── services/
│   │       │   ├── graph.ts           # Neo4j queries (network, events, connections)
│   │       │   └── platforms/         # Discord, Telegram, iMessage, WhatsApp, Slack
│   │       └── lib/         # Neo4j driver, Supabase client
│   └── shared/              # Shared TypeScript types
├── infra/
│   └── schema.sql           # Postgres schema
├── .env.example
└── package.json             # npm workspaces root
```

### Data Model

**Postgres** (structured data — profiles, socials, events):

```sql
users (id, name, email, photo_url, card_code)
social_links (user_id, platform, handle, url, visibility)
events (id, name, code, location, starts_at, ends_at, created_by)
```

**Neo4j** (graph relationships):

```cypher
(:Person {id, name, photoUrl})-[:WAFT {eventId, strength, createdAt}]-(:Person)
(:Person)-[:ATTENDED {checkedInAt}]->(:Event {id, name})
```

## Core Flows

### QR Scan → Connect

1. Person B scans Person A's QR code (native camera — no app needed). The QR encodes the opaque `card_code` (resolved via `GET /cards/:cardCode`), not the internal user id, so it can be rotated if it leaks.
2. Universal link resolves:
   - **Has app?** → Deep link, instant mutual connection
   - **No app?** → Web card showing name, photo, socials as tappable icons + "Get Waft" CTA
3. Connection edge created in Neo4j
4. WebSocket pushes update to live event graph

### Event Check-In

1. Organizer creates event room → gets a shareable QR code encoding the event `code` (resolved via `GET /events/by-code/:code`)
2. Attendees scan event QR → checked into that event's subgraph
3. Live event graph dashboard shows connections forming in real-time — the `/events/:eventId/live` WebSocket sends the current graph on connect, then pushes fresh snapshots on every connection and check-in

### Group Creation

1. User selects nodes in their graph (or app suggests a cluster)
2. `POST /groups/suggest-platform` identifies which platform has best coverage
3. User picks platform → one tap:
   - **Discord**: Bot automatically creates server, sends invite links
   - **Telegram**: Deep link prompts user to create the group with the Waft bot added; members who've started the bot get notified
   - **iMessage/WhatsApp/Slack**: Deep link opens native app with recipients pre-filled

## Platform Integration Matrix

| Platform | Integration type | Capabilities |
|----------|-----------------|-------------|
| Discord | Automated (Bot API) | Create server, generate invite, DM all members¹ |
| Telegram | Deep link (`startgroup`) | Prompt user to create group with Waft bot added; bot pre-notifies members who've started it² |
| iMessage | Deep link | Open Messages with all phone numbers in "To:" field |
| WhatsApp | Deep link | Open compose with member list (manual group creation) |
| Slack | Deep link | Open multi-party DM |

¹ Discord's `POST /guilds` only works for bots in fewer than 10 guilds — fine for demos, needs a channel-per-event model in one guild before real usage.
² Telegram's Bot API cannot create groups or add members directly; the `startgroup` deep link is the only supported flow.

## Onboarding (The 20-Second Signup)

```
Open app → Sign in with Apple/Google (1 tap)
→ QR code generated instantly. You're ready to scan/be scanned.
→ [Optional] "Add one social?" [LinkedIn] [Instagram] [Skip]
→ Done. Go meet people.
```

Social links are added progressively through contextual prompts:
- "Someone tried to find your Instagram — add it?"
- "3 people you met have Discord linked — add yours?"
- After an event: "Add your socials so the 12 people you met can find you"

## Gamification & Retention

- **Graph as game** — every new connection visibly grows your network
- **Network role badges** — Connector (bridges clusters), Hub (high degree), Bridge (high betweenness)
- **Event graph memories** — "You met 15 people at PyCon across 3 distinct groups"
- **Weekly graph digest** — "Your network grew 12% this week. 3 new people joined from your contacts."
- **Waft strength** — edge weight grows with real engagement (canonical spec below)
- **Shareable graph cards** — abstract, beautiful network snapshots for stories/social posts

### Waft Strength — canonical spec

Strength measures **ongoing, intentional engagement between two specific people**.
Scanning is a one-time handshake that creates the edge; it never adds strength,
and rescanning is a no-op (`POST /connections` returns `already_connected`).
Each signal is weighted by how deliberate it is:

| Signal | Weight | Rationale |
|---|---|---|
| Base handshake (the scan) | 1, once | Existence of the edge; never repeats |
| Explicitly sharing a non-public social with this person | +3 per platform | Strongest trust signal — granting access the public card doesn't give |
| Checked into the same event | +2 per distinct event | Automatic tie evidence — you keep ending up in the same rooms |
| Creating/joining a group together | +2 per group | Deliberate "let's keep talking" action |
| Opening their profile from your network | +log₂(1 + taps), capped at +2 total | Weak interest signal — log-scaled so it can't be farmed |

Structural rules (these matter more than the exact numbers):

- **Store raw counters, derive strength.** The `WAFT` edge carries
  `sharedSocials`, `sharedEvents`, `groupsTogether`, `profileTaps`,
  `lastInteractedAt`; `strength` is materialized from them on each write so
  graph reads stay a single property lookup. Weights can be retuned later
  without corrupting history — a bare accumulating integer can't.
- **Diminishing returns on anything repeatable.** Spammable signals (taps) are
  log-scaled and capped; naturally rare ones (social shares — ~10 platforms
  exist) stay linear. That's the entire anti-gaming story at this scale.
- **Symmetric display, private inputs.** Taps and shares are one-directional
  but the edge is symmetric: both directions sum into one strength, and the
  breakdown is never exposed — both people see "strength 7", neither sees who
  viewed whom how often.
- **Decay (post-demo).** Displayed strength gets multiplied by
  `exp(-months_since_last_interaction / 6)` at render time; counters are never
  destroyed, so one interaction fully reignites a dormant tie. This is what
  makes the visualization themes physically meaningful — stale connections
  literally drift outward.

Implementation order follows the missing surfaces, each feeding counters as it
lands: shared-event counting (check-ins already exist), tap tracking (needs a
tappable profile view in the Network tab), explicit social sharing (needs the
`mutual_only` visibility UI), groups (endpoints exist, untested).

## Privacy Model

- Users explicitly choose which socials to link and their visibility:
  - `public` — visible to anyone who scans their QR
  - `event_only` — only visible to people met at the same event
  - `mutual_only` — only visible after mutual connection
- Phone numbers (for iMessage/WhatsApp groups) are stored as a `phone` social link — opt-in only
- QR web card only shows `public` socials
- No contact list scraping without explicit permission
- Group creation only includes users who have the relevant platform linked

## AI Features (Future)

- **Smart introductions** — "Based on graph topology, you should meet X — they bridge a cluster you're not connected to"
- **Post-event summaries** — AI-generated recap of who you met, suggested follow-ups
- **Conversation context** — "You and X both know Y and Z — open with that"
- **Graph recommendations** — node2vec or GNN-based connection suggestions from structural similarity

## Roadmap

### Phase 1: MVP (2 weeks — target: YC AI Startup School demo)
- [x] API scaffold (Fastify + Neo4j + Supabase)
- [x] Web card page (QR scan fallback for non-app users)
- [x] Live event graph visualization (Sigma.js + WebSocket)
- [x] Group creation (Discord, Telegram, iMessage, WhatsApp, Slack)
- [x] API hardening pass — verified boot end-to-end (fixed ESM config, Node 20 WebSocket crash), clean 400s on invalid bodies, `card_code`/event-`code` lookup routes, live WebSocket broadcasts actually wired to connections/check-ins, Telegram rewritten around real Bot API limits, cumulative connection strength
- [x] Auth verification middleware — Supabase JWTs verified locally (HS256, `SUPABASE_JWT_SECRET`); identity fields derive from the token, self-scoped routes moved to `/users/me` + `/connections/me/graph`, and group endpoints only accept users the caller has connected with (blocks handle/phone harvesting)
- [x] Fix `apps/web` install — removed unused `@sigma/react` dep (doesn't exist on npm); workspace-wide `npm install` works again
- [x] Supabase project setup + schema deployment (ES256 signing keys — API verifies tokens via the project JWKS endpoint, no shared secret)
- [x] Neo4j Aura instance provisioning (uniqueness constraints on `Person.id` / `Event.id`; full register→connect→graph smoke test passed against live infra)
- [x] Mobile app scaffold (Expo SDK 57 — QR card display, camera scanner wired to connect/check-in, network list grouped by degree; graph *visualization* still list-based pending a native renderer)
- [x] Auth flow — email OTP code (zero-config baseline) + Google OAuth (PKCE via expo-web-browser); silent profile registration from OAuth metadata, one-field onboarding for email sign-ins. Apple sign-in deferred until an Apple Developer account exists (one more button in the same flow)
- [x] Deploy web + API (Vercel + Railway) — API at `waft-production.up.railway.app` (health-checked, `railway.json` config), web at **`getwaft.app`** (Vercel, card pages live; `waft-web.vercel.app` still aliases). Email via Resend on the verified domain (`auth@getwaft.app`) — sign-in codes deliver to any address
- [ ] Live demo at YC AI Startup School

### Phase 2: Post-Demo Polish
- [ ] OAuth connect for Discord, LinkedIn, GitHub, Spotify
- [ ] Event-context profiles (different card per event type)
- [x] Event icebreakers — host-authored at event creation or AI-generated (Claude API, `claude-opus-4-8`, structured outputs; generic fallback without a key); stored on the event, served randomly in the connect response, shown on the post-scan "Break the ice" card
- [ ] Styled scan codes — colored/emoji-branded QR codes (logo center, rounded modules, event-themed palettes — QR tolerates ~30% styling via error correction, stays camera-app-scannable), and longer-term a signature Waft code format à la Spotify's waveform codes (custom aesthetic, but only our scanner reads it — so always paired with a fallback QR/link)
- [ ] NFC tag support (stickers/cards encoding the `waft.app/c/<card_code>` URL — same infra as QR, native tap-to-open on iOS/Android)
- [ ] BLE tap-to-connect (AirDrop-style phone-to-phone gesture; NameDrop has no public API and NFC P2P is dead, so this requires both users to have the app open — separate design effort)
- [ ] Push notifications ("X just joined Waft")
- [ ] Phone sign-up (SMS OTP) — Supabase phone provider + Twilio; pairs with iOS one-time-code autofill from Messages (the input hint is already in place). Blocked on a paid Twilio account + US A2P/toll-free verification (takes days–weeks — start alongside the SMS-nudges registration below)
- [ ] SMS nudges for phone-only profiles — event-driven only (someone viewed your card with no socials to tap; post-event digest with platform coverage), hard-capped (1/week, ~3 lifetime), stops permanently once one social is added, magic-link deep link to add-social screen. Requires explicit opt-in at signup + A2P 10DLC campaign registration (takes weeks — start early)
- [ ] Interaction-based waft strength — strength grows from real engagement (opening/tapping a connection's profile, explicitly sharing a non-public social with that person), not rescans (a rescan is a no-op handshake; the API already returns `already_connected`). Needs per-connection interaction tracking + the mutual/event-only social-sharing UI
- [ ] Tiered social visibility — expose the existing `social_links.visibility` enum (`public` / `mutual_only` / `event_only`) in the editor so users split a professional layer (LinkedIn/GitHub, public) from a personal layer (Instagram/Snapchat/phone, restricted). **Deliberately NOT a per-connection visibility matrix** — picking which socials each of 40 people sees is exactly the friction Waft kills ("scan once, no negotiation"); that idea was considered and rejected. Instead: a one-tap **"share my personal socials with this person"** action on a trusted connection. Architectural note: that explicit-share action **is** the strongest waft-strength signal already spec'd (+3/platform above) — the same gesture grants access and reinforces the edge, so build it once, wired to both
- [x] Optional password for returning users — opt-in, post-signup (never a signup method). Onboarding offers an optional password field (skip = blank); a Settings screen (⚙ in the header) sets/changes it anytime via `updateUser({ password })`. The sign-in password link surfaces only when a device flag (`passwordFlag`, set when a password is saved) is present, or the review email is typed — so users without a password never see a path that can't work for them. Returning on a fresh device falls back to OTP/Google (no lockout)
- [x] Delete account (self-serve) — Settings → "Delete account…" (typed DELETE confirmation + alert) → `DELETE /users/me` removes the user across **both** stores: Neo4j Person via `DETACH DELETE` (drops WAFT + ATTENDED), then Supabase profile + social_links (cascade), auth user last so a partial failure stays retryable. Events they created are kept with a tombstoned host (`created_by` nulled). Still to do when the OTA batch ships: swap the privacy policy's "email us to delete" line for the real button
- **Onboarding minimization** — cutting the "stranger → onboarded + connected" funnel toward the native-app floor (install once + one identity gesture + everything else auto):
  - [x] Auto-connect on join (**Option A**, email-matched pending connection) — the web card captures the viewer's email (`ConnectOnJoin`) → `POST /connections/pending` stores `{from_user, invitee_email}` → `POST /users` fulfills it on signup via `createConnection`, then deletes it. Removes the second QR scan for invited users. Safe: only fires when the invitee authenticates with that email (never force-connects an existing account). Web + API only, no mobile change. Verified e2e in prod.
  - [~] **Sign in with Apple** — *code done* (native Face-ID via `expo-apple-authentication` + Supabase `signInWithIdToken`; official HIG button above Google, iOS-gated; name stashed from first-sign-in credential → silent onboarding like Google). One-tap auth, no typing; also App Store Guideline 4.8-required once Google is offered. **To go live:** (1) Supabase → Auth → Providers → Apple: enable + add bundle id `com.getwaft.app` to Client IDs (native id_token flow needs no secret); (2) a new native build (not OTA) + TestFlight submit — this build also bakes in the entire held OTA batch, superseding it.
  - [ ] **Universal Links** (**Option D**) — `apple-app-site-association` on getwaft.app + associated-domains entitlement so a post-install QR scan opens the app straight to an auto-connect (scan → connected, one gesture) instead of Safari. Improves link handling app-wide.
  - [ ] Auto-suggest display name for email signups (from the email local-part, one-tap accept) — the last manual onboarding field; OAuth already skips it
- [ ] Social priority / "most active" indicator — a `primary`/`priority` flag on `social_links` with a "★ most active" toggle in the editor; the platform(s) so marked render with a brighter aura / gentle pulse on their graph satellite badge. Answers "which of your 5 platforms should I actually use?" — a strictly better answer than "here are all of them, you pick." Start **binary** (mark 1–2), not drag-to-rank (ranking is friction for marginal signal). Later: auto-surface "people usually reach me here" from which badge others actually tap. High delight, low cost, reads instantly on the projected wall
- [x] Graph analytics — `computeGraphStats` in `@waft/shared` (degree, Brandes betweenness, density) rendered as the live leaderboard on the event wall (top connectors + cluster bridges) and the mobile stats line. Clustering/shortest-path insights still open
- [ ] Gamification badges
- [ ] Coalesce motion for the graph (see `DESIGN.md`) — new nodes condense in from drifting vapor instead of popping; new edges/wafts form as a gust that flows between the two nodes and settles into the line. Highest drama on the live event wall as people check in. Same vapor aesthetic as the logo, tying the whole app into one motion language
- [ ] Animated "waft" logo + folding-W app icon — coalesce splash/sign-in via react-native-svg (approximating the web `feTurbulence` prototype), adaptive dark/light ribbon-W icon assets. Wordmark is font-set; ribbon lives in the icon. Icon = native asset (rides a build), splash = OTA
- [ ] Edge visual encoding v2 — map waft-edge appearance to relationship signals: thickness = strength, opacity = mutual connections (v1 shipped), plus color ramps for interaction level, dash patterns for shared-platform count, and subtle pulse animation for edges created in the last N minutes (event-wall drama). Interaction/shared-platform inputs arrive with the waft-strength counters; animation needs Reanimated or SVG SMIL on web
- [x] Node avatars v1 — color + shape picker on the card tab, stored on the profile and mirrored onto the Neo4j node, rendered in every graph (accent + more shapes still open)

### Hardening & scale (see `docs/architecture-review-2026-07.md` — full 5-lens architecture review)
- [x] Security fixes from the review (2026-07-21): group-route `event_only` PII leak (visibility filter added), `javascript:`/`data:` URLs on the public card (http(s) allow-list at render + write), event-graph edge injection via unchecked `eventId` on `/connections` (now requires an ATTENDED edge), graph-depth clamp `[1,4]`, dead feedback honeypot, `CARD_ORIGIN` domain-drift fallback. RLS confirmed live on `users`/`social_links`/`events`/`feedback` (verified against the anon key).
- [x] Pre-demo hardening (2026-07-21): 2–5s TTL cache on `getEventGraph` with write-invalidation (absorbs reconnect-storm read bursts); web event wall auto-reconnects with jittered exponential backoff (was: one blip froze the wall permanently); rate limiting keyed on bearer token, not IP, so a whole venue on one NAT'd IP no longer shares a bucket; null-`ends_at` walls now expire 48h after start instead of staying a permanent public attendee list.
- [ ] **Delta / coalesced live broadcasts** — today every check-in re-broadcasts the *entire* graph to *every* viewer (O(N×viewers)); switch to `{type:"node_added"}` deltas or a debounced snapshot. Highest-leverage scale change; real refactor.
- [ ] **Horizontal scale for the live layer** — `liveEvents.ts` is a process-local `Map` and the rate-limit store is in-memory, so the API is single-instance (a 2nd Railway replica silently breaks the wall for half the room). Needs Redis pub/sub or Supabase Realtime for fanout + a shared limit store. `eventId` is a clean shard key.
- [ ] **~10 vitest tests + CI** pinning the comment-only invariants (visibility filtering, delete ordering/idempotency, `card_code` preservation, wall expiry) + codify the live RLS policies in `infra/schema.sql` (currently dashboard-only — infra-as-code drift).
- [ ] **Reconcile `packages/shared` types** — they're camelCase over the API's snake_case reality; mobile hand-redeclares them, so client/server drift is caught by phone crashes. Consider a Zod-schema-derived client.
- [ ] **Consider consolidating Postgres + Neo4j → one store** (a `connections` table + recursive CTE + a join table for multi-event edges). The review's headline: it restores transactions, deletes a whole class of cross-store-drift bugs, enables RLS as a real backstop, and lets an edge belong to *multiple* events (the current single-`eventId`-per-edge schema can't, which caps the cross-event-graph "moat"). **Explicitly a post-demo decision** — a multi-day migration touching every write path is the wrong thing to attempt on a launch deadline, and it's contingent on whether the compounding cross-event graph is actually the product's moat.

### Phase 3: Growth
- [ ] Contact import (hashed phone number matching)
- [ ] Linktree import (parse existing link pages)
- [ ] Event organizer partnerships (branded event rooms + analytics)
- [ ] AI recommendations
- [ ] Avatar system v2 — Mii/Reddit-style composable avatars (face, hair, accessories — thousands of permutations); avatar becomes the node rendering everywhere your profile appears
- [ ] Network visualization themes — same graph data, swappable renderers/layouts: solar system (you as the sun, orbits by connection strength), cosmic constellation, protein structure, atomic/molecular bonds, Tony Stark holograms, neurons + synapses, houses in a neighborhood, classic network graph. Ties into the Premium "custom graph themes" tier and shareable graph cards
- [ ] Premium tier (unlimited event history, advanced graph analytics, export)

## Revenue Model (Future)

- **Free tier**: Last 3 events, basic graph, up to 5 socials linked
- **Premium ($5/mo)**: Unlimited history, advanced analytics, custom graph themes, priority in recommendations
- **Event organizer tier**: Branded rooms, attendee graph analytics, sponsor placements
- **Enterprise**: Team networking dashboards, CRM integration, SSO

## Development

```bash
# Install dependencies
npm install

# Start API (requires .env with Supabase + Neo4j credentials)
npm run dev:api

# Start web app
npm run dev:web

# Start mobile app
npm run dev:mobile
```

Copy `.env.example` to `.env` and fill in your credentials for Supabase, Neo4j Aura, Discord bot token, and Telegram bot token + username (`TELEGRAM_BOT_USERNAME`, used for the `startgroup` deep link).


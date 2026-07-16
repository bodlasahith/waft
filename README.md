# Waft

**Platform-agnostic social graph for IRL connections.**

Scan once. Connect everywhere. See your network grow.

---

## What is Waft?

Waft replaces the awkward "What's your Instagram?" exchange at events with a single QR scan that surfaces all of a person's linked socials at once. The person scanning taps whichever platform *they* use — no negotiation, no missed connections across generational or professional divides.

Every connection forms an edge in a live graph visualization. Over time, users see their network topology — clusters, bridges, mutual connections — rather than a flat contact list.

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
- **Waft strength** — edge weight increases with mutual connections, shared events, and interactions
- **Shareable graph cards** — abstract, beautiful network snapshots for stories/social posts

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
- [ ] Deploy web + API (Vercel + Railway)
- [ ] Live demo at YC AI Startup School

### Phase 2: Post-Demo Polish
- [ ] OAuth connect for Discord, LinkedIn, GitHub, Spotify
- [ ] Event-context profiles (different card per event type)
- [ ] NFC tag support (stickers/cards encoding the `waft.app/c/<card_code>` URL — same infra as QR, native tap-to-open on iOS/Android)
- [ ] BLE tap-to-connect (AirDrop-style phone-to-phone gesture; NameDrop has no public API and NFC P2P is dead, so this requires both users to have the app open — separate design effort)
- [ ] Push notifications ("X just joined Waft")
- [ ] SMS nudges for phone-only profiles — event-driven only (someone viewed your card with no socials to tap; post-event digest with platform coverage), hard-capped (1/week, ~3 lifetime), stops permanently once one social is added, magic-link deep link to add-social screen. Requires explicit opt-in at signup + A2P 10DLC campaign registration (takes weeks — start early)
- [ ] Graph analytics (centrality, clustering, shortest path)
- [ ] Gamification badges
- [ ] Node avatars v1 — simple customization (color, shape, accent) so your node is recognizably *you* in the graph; stored as a small JSON blob on the user, rendered client-side

### Phase 3: Growth
- [ ] Contact import (hashed phone number matching)
- [ ] Linktree import (parse existing link pages)
- [ ] Event organizer partnerships (branded event rooms + analytics)
- [ ] AI recommendations
- [ ] Avatar system v2 — Mii/Reddit-style composable avatars (face, hair, accessories — thousands of permutations); avatar becomes the node rendering everywhere your profile appears
- [ ] Network visualization themes — same graph data, swappable renderers/layouts: solar system (you as the sun, orbits by connection strength), cosmic constellation, protein structure, neurons + synapses, houses in a neighborhood, classic network graph. Ties into the Premium "custom graph themes" tier and shareable graph cards
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

## License

MIT

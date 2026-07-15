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

1. Person B scans Person A's QR code (native camera — no app needed)
2. Universal link resolves:
   - **Has app?** → Deep link, instant mutual connection
   - **No app?** → Web card showing name, photo, socials as tappable icons + "Get Waft" CTA
3. Connection edge created in Neo4j
4. WebSocket pushes update to live event graph

### Event Check-In

1. Organizer creates event room → gets a shareable QR code
2. Attendees scan event QR → checked into that event's subgraph
3. Live event graph dashboard shows connections forming in real-time

### Group Creation

1. User selects nodes in their graph (or app suggests a cluster)
2. `POST /groups/suggest-platform` identifies which platform has best coverage
3. User picks platform → one tap:
   - **Discord/Telegram**: Bot automatically creates server/group, sends invite links
   - **iMessage/WhatsApp/Slack**: Deep link opens native app with recipients pre-filled

## Platform Integration Matrix

| Platform | Integration type | Capabilities |
|----------|-----------------|-------------|
| Discord | Automated (Bot API) | Create server, generate invite, DM all members |
| Telegram | Automated (Bot API) | Create supergroup, generate invite link, add members |
| iMessage | Deep link | Open Messages with all phone numbers in "To:" field |
| WhatsApp | Deep link | Open compose with member list (manual group creation) |
| Slack | Deep link | Open multi-party DM |

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
- [ ] Supabase project setup + schema deployment
- [ ] Neo4j Aura instance provisioning
- [ ] Mobile app scaffold (Expo — QR display, scanner, basic graph)
- [ ] Auth flow (Apple/Google sign-in)
- [ ] Deploy web + API (Vercel + Railway)
- [ ] Live demo at YC AI Startup School

### Phase 2: Post-Demo Polish
- [ ] OAuth connect for Discord, LinkedIn, GitHub, Spotify
- [ ] Event-context profiles (different card per event type)
- [ ] NFC support
- [ ] Push notifications ("X just joined Waft")
- [ ] Graph analytics (centrality, clustering, shortest path)
- [ ] Gamification badges

### Phase 3: Growth
- [ ] Contact import (hashed phone number matching)
- [ ] Linktree import (parse existing link pages)
- [ ] Event organizer partnerships (branded event rooms + analytics)
- [ ] AI recommendations
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

Copy `.env.example` to `.env` and fill in your credentials for Supabase, Neo4j Aura, Discord bot token, and Telegram bot token.

## License

MIT

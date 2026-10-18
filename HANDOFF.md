# Waft — Session Handoff

> A living snapshot for switching devices (or resuming after a break) **without
> relying on context compaction.** Update the "Snapshot" + "In flight" + "Next
> actions" sections whenever you're about to switch machines. Everything here is
> derivable from the repo — it's a *pointer map*, not a second source of truth.

**Last updated:** 2026-10-18 (moved to new laptop; WIP branch merged into `main`) · **Branch:** `main` · **Latest pushed commit:** see `git log --oneline -1`

---

## 1. Where we are (strategy)

**Waft is live on the App Store** (since 2026-08-16, `apps.apple.com/app/id6792655313`). The mode
is still **customer discovery, not feature-building**: validate the pain before building more
(advice from a YC staffer after AI Startup School).

- **Positioning** (see `[[waft-positioning]]` memory + `docs/GPT_*`): host/event = acquisition
  **wedge**; individual's portable card + cross-event graph = **moat/retention**. Integrate with
  (don't compete with) Luma/Partiful. ICP = networking events, 30–150 people.
- **Open question discovery must answer:** target host or individual first? Count *lean-forwards*,
  not politeness.
- **Host outreach so far** (`docs/gtm-outreach.md`): first wave of 9 offers to SF/Seattle hosts
  2026-08-12 → 08-15, then follow-ups and LinkedIn notes through 2026-09-15. Only reply: New Tech NW
  declined (2026-08-30). No other replies as of 2026-10-18, so treat the pending rows as dead.
- **Pivot (2026-09-24):** stop 1:1 LinkedIn notes. The product is visual, so get Waft into a few
  real events (even self-run), film the graph forming, and use that footage on X / Reels / Reddit.
  Luma stays the host-finding channel. The X launch thread is drafted in `docs/gtm-outreach.md`
  but **not posted yet**.
- **Paused** 2026-09-26 → 2026-10-18 (no outreach or code work while switching machines).

## 2. What's shipped since the last handoff (all on `main`, pushed)

- **App Store launch** after three review rounds:
  - Login decoupled from Neo4j: register writes Postgres first and the graph node best-effort;
    `/connections` self-heals missing nodes; in-process keep-warm heartbeat + `/health/db` so Aura
    Free never auto-pauses (`[[appstore-neo4j-login-coupling]]`)
  - Apple/Google sign-ins never hit the name prompt; rename via `PUT /users/me/name` + Settings
  - Camera pre-permission button says "Continue" / "Open Settings"; age rating raised instead of
    building age assurance (`[[appstore-age-rating-camera]]`)
- **"Get Waft" CTA** on getwaft.app points at the App Store listing (`NEXT_PUBLIC_APP_STORE_URL` override)
- **Event Replay:** scrub the event wall from empty room to full; demo-event seed script
- **Edges carry `eventIds` (a set)** instead of a single `eventId`, so cross-event connections
  survive (previously parked; now done)
- API test suite: 32 vitest tests in `packages/api` (`npm test`)
- GTM: host target lists, cold-email playbook, follow-up sequence, channel strategy + X thread draft

## 3. In flight / uncommitted (⚠️ won't travel via git until committed)

**Working tree is CLEAN.** `session-2026-09-23-wip` (GTM-doc commits) was fast-forwarded into
`main` on 2026-10-18; there is no other open branch work. Always run `git status` on arrival.

## 4. Immediate next actions

- [ ] Post the X launch thread (drafted in `docs/gtm-outreach.md`: native MP4 upload, pin it,
      weekday 9–11am PT, reply to event threads with the clip for 48h)
- [ ] Get Waft into 1–3 real events (self-run is fine) and film the graph forming. That footage
      is the content engine for X / Reels / Reddit.
- [ ] Keep mining Luma for recurring 30–150-person hosts; offer the free live wall
- [ ] Post-validation: decide host-vs-individual, then pull the ranked roadmap slice
- [ ] Durable infra fix when traction justifies it: paid Neo4j tier or the single-Postgres
      migration in `docs/architecture-review-2026-07.md`

## 5. Setting up the other laptop

```bash
git clone https://github.com/bodlasahith/waft.git && cd waft
npm install            # NOT npm ci (EBUSY issues); workspaces: apps/*, packages/*
```

**Secrets don't travel via git** — `.env` (root) and `apps/mobile/.env` are gitignored. Copy them
over securely (AirDrop / password manager / re-create from the values in Railway + Supabase +
Vercel dashboards). Root `.env` keys: SUPABASE_* , NEO4J/AURA_* , RESEND_API_KEY, ANTHROPIC_API_KEY,
DISCORD/TELEGRAM tokens. Mobile `.env`: EXPO_PUBLIC_* .

**Dev commands** (from root): `npm run dev:api` · `npm run dev:web` · `npm run dev:mobile`
**Tests:** `cd packages/api && npm test`
**Vercel CLI** (optional, for env/deploy): `npx vercel link --project waft-web --cwd apps/web` — the
current laptop is **not** linked yet (creates a gitignored `apps/web/.env.local` OIDC token; doesn't travel).
Mobile `.env` can be derived from the root one: `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` = root
`SUPABASE_URL`/`SUPABASE_ANON_KEY`; see `apps/mobile/.env.example` for the rest.
**Note:** the office network blocks Neo4j Aura port 7687 — run graph-touching work Railway-side or
off that network (see `[[waft-auth-network-constraints]]`).

## 6. Key docs map

| Need | File |
|---|---|
| Product spec + full roadmap | `README.md` |
| Demo plan / choreography | `DEMO.md` |
| Deploy URLs, platform quirks | `[[waft-deployment]]` memory |
| App Store status / review history | `[[appstore-neo4j-login-coupling]]`, `[[appstore-age-rating-camera]]` memories |
| Positioning / GTM strategy | `[[waft-positioning]]` memory, `docs/gtm-outreach.md` |
| Discovery questions | `docs/customer-discovery.md` |
| Architecture review (5-lens) | `docs/architecture-review-2026-07.md` |
| Product vision / GPT consult | `docs/GPT_VISION.md`, `docs/GPT_ANALYSIS.md` |
| Visual system | `DESIGN.md` |

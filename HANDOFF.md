# Waft — Session Handoff

> A living snapshot for switching devices (or resuming after a break) **without
> relying on context compaction.** Update the "Snapshot" + "In flight" + "Next
> actions" sections whenever you're about to switch machines. Everything here is
> derivable from the repo — it's a *pointer map*, not a second source of truth.

**Last updated:** 2026-07-27 (TestFlight button wired; tree clean) · **Branch:** `main` · **Latest pushed commit:** see `git log --oneline -1`

---

## 1. Where we are (strategy)

Post-YC AI Startup School (6k attendees — too big to demo; pitched verbally). A YC
staffer's advice reframed the priority: **validate the pain before building more.**
So the current mode is **customer discovery, not feature-building.**

- **Positioning** (see `[[waft-positioning]]` memory + `docs/GPT_*` ): host/event = acquisition
  **wedge**; individual's portable card + cross-event graph = **moat/retention**. Integrate with
  (don't compete with) Luma/Partiful. ICP = networking events, 30–150 people.
- **Open question discovery must answer:** target host or individual first? Count *lean-forwards*,
  not politeness.
- **Next real-world beat:** Pear VC "Prime Day" (Thursday) — emailed Nate to run a live wall/sim at
  breakfast; the Uber rides + lunch are discovery conversations. Capture the artifact (connected-room
  graph + one organizer reaction) — it's what makes all later outreach convert.

## 2. What's shipped recently (all on `main`, pushed)

- Wall animation (force-directed coalesce) on the web event graph
- Both-attended guard on event connections (`/connections`)
- Branded QR codes (`demo-assets/generate-qr.mjs`) — scannable-verified, in poster + wallpaper
- GTM: `docs/gtm-outreach.md` (Luma-first host outreach) + `docs/customer-discovery.md` (Mom Test)
- Safety net: 26-test vitest suite in `packages/api` (`npm test`) + live RLS codified in `infra/schema.sql`
- Roadmap parked: `eventId→eventIds`, pre-fill-socials (consented OAuth not scraping),
  post-validation profile slice, age-assurance for 18+/21+ events, 4 GPT-consult ideas
- **TestFlight URL live on getwaft.app** — `NEXT_PUBLIC_TESTFLIGHT_URL` set in Vercel (Production +
  Preview) + redeployed; the card/landing "Get Waft" button now points at the install page (verified inlined)

## 3. In flight / uncommitted (⚠️ won't travel via git until committed)

**Working tree is currently CLEAN — everything is committed and pushed to `main`.** Still, always run
`git status` on arrival; if anything shows up, decide per file before switching or it's lost on the
other machine. (Resolved since last handoff: `useCardAnimation.ts` committed — tilt now sourced from
`useCardMotion`; stray empty `eas.json` deleted; README edits + parked roadmap items committed.)

## 4. Immediate next actions

- [ ] Await Nate's reply re: Pear breakfast sim; prep with `docs/customer-discovery.md`
- [ ] Run the discovery conversations (Pear + Luma hosts from `docs/gtm-outreach.md`)
- [ ] App Store review pending (submitted Sat) — Sahith is checking App Store Connect directly
- [ ] Post-validation: decide host-vs-individual, then pull the ranked roadmap slice
- [x] TestFlight "Get Waft" button wired (Vercel env + redeploy, live on getwaft.app)

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
**Vercel CLI** (optional, for env/deploy): `npx vercel link --project waft-web --cwd apps/web` — this
machine is already linked (creates a gitignored `apps/web/.env.local` OIDC token; doesn't travel).
**Note:** the office network blocks Neo4j Aura port 7687 — run graph-touching work Railway-side or
off that network (see `[[waft-auth-network-constraints]]`).

## 6. Key docs map

| Need | File |
|---|---|
| Product spec + full roadmap | `README.md` |
| Demo plan / choreography | `DEMO.md` |
| Deploy URLs, platform quirks | `[[waft-deployment]]` memory |
| Positioning / GTM strategy | `[[waft-positioning]]` memory, `docs/gtm-outreach.md` |
| Discovery questions | `docs/customer-discovery.md` |
| Architecture review (5-lens) | `docs/architecture-review-2026-07.md` |
| Product vision / GPT consult | `docs/GPT_VISION.md`, `docs/GPT_ANALYSIS.md` |
| Visual system | `DESIGN.md` |

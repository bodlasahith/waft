# Demo Plan — YC AI Startup School (July 25–26) + Pear Prime

The pitch is the product: every "what's your contact?" moment is a demo.
Funnel: **scan → web card → Get Waft (TestFlight) → they scan the next person.**

## Pear Prime (~40 handpicked people) — the beachhead

A curated 40-person room is Waft's perfect habitat: full-room adoption is
actually achievable, and the event's purpose ("meet each other") is the
product's purpose.

- [ ] Email Pear organizers offering the wall as the event's networking layer
      (projected live graph + AI icebreakers themed to Pear Prime, zero setup)
- [ ] Create the "Pear Prime" event with tailored icebreakers
- [ ] TestFlight QR + join code printed for tables
- [ ] Capture the artifact: screenshot/recording of the fully-connected room
      graph + leaderboard — this is the "result" slide for the YC weekend

## ⚠️ The one thing that can brick the demo

The phone's free-signing certificate from the July 19 build **expires ~July 26 —
mid-demo**. Either (a) rebuild the phone Thursday/Friday so the 7-day window
covers the weekend, or (b) once Apple Developer enrollment clears, rebuild
signed with the paid cert (valid a year) and never think about it again.
**Do not walk into Saturday on the July 19 build.**

## Week-of checklist

### Saturday 7/19 (today)
- [ ] Apple Developer enrollment ($99) — the review clock only starts now
- [ ] Order NFC stickers (NTAG215, Prime shipping)
- [ ] Start build-in-public thread on X (one feature clip per day, TestFlight link once live)

### Sunday–Monday
- [ ] Change bundle id `com.anonymous.waft` → `com.getwaft.app` (before first TestFlight upload — painful after)
- [ ] Add `expo-updates` (EAS Update) so post-review JS fixes ship over the air
- [ ] Start aesthetic redesign (ships via EAS Update even after review — no deadline pressure)
- [ ] DM afterparty hosts on Luma offering the live wall (official Moss/Supabase/Modal/Render party, Anthropic HQ, Respan @ The Pearl, Stanford Founders)

### Tuesday–Wednesday (enrollment should be cleared)
- [ ] Upload first TestFlight build → submit for external beta review
- [ ] Internal testing meanwhile (instant, no review — your own devices)
- [ ] Point the web card's **Get Waft** button at the TestFlight public link
- [ ] Write NFC stickers with card URL (`getwaft.app/c/x7W_R7LqZ-`) + one with the TestFlight link

### Thursday–Friday 7/24
- [ ] **Final phone rebuild** (see cert warning above)
- [ ] Create the real events in-app: "YC AI Startup School 2026" + one per afterparty attending
- [ ] Print event QR poster + TestFlight QR (side by side: "Check in" / "Get the app")
- [ ] Set phone lock screen to card QR wallpaper
- [ ] Dry-run the full choreography once with both devices
- [ ] Battery pack charged; Personal hotspot tested (venue Wi-Fi is always bad)

## Demo choreography (per room)

1. **Arrive**: create/open the event in Waft → project or open the wall
   (`getwaft.app/event/<id>`) on any available screen
2. **Check in** via event QR (or join code from a slide)
3. **Meet someone**: they scan your card (camera app works — no app needed)
   → web card → Get Waft → they check in → **their node pops on the wall live**
4. **Connect**: scan each other → icebreaker appears → conversation starts itself
5. **Show the graph**: pinch/zoom your network, tap an edge → "we met 4 minutes
   ago at this event" → tap their node → their links
6. **Point at the wall**: connector leaderboard + cluster bridges — "the room
   is competing to be the best networker and doesn't know it yet"

## 30-second pitch (say while they scan)

> "Waft replaces the what's-your-Instagram dance — one scan, they pick the
> platform *they* use. Every scan becomes a node in a live graph — here's this
> room's, growing right now. It's the phonebook rebuilt for people whose
> contacts live on twelve platforms."

## Fallbacks

| Failure | Plan |
|---|---|
| TestFlight not approved by Sat | Funnel still works: camera scan → web card shows all links. Collect emails; the app is "coming this week" |
| Venue internet dead | Personal hotspot (everything is cloud; phone data is enough) |
| Railway down | `railway status` + redeploy from dashboard; the web card + wall are Vercel-side and independent for viewing |
| AI icebreakers fail | Automatic — generic fallback list ships with every event |
| Someone's phone won't scan | Join-by-code, printed under the QR |

## Assets to generate (ask Claude)

- [ ] Event QR poster (print-ready, event QR + join code + TestFlight QR)
- [ ] Lock-screen wallpaper with card QR
- [ ] Demo-data reset script (clear test artifacts before Saturday: fake profiles stay or go — decide)

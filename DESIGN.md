# Waft — Visual Language

The through-line: **waft** = something drifting, coalescing, evanescing (scent,
smoke, sound, breeze). Motion and form should feel like vapor gathering into
shape and gently dissipating. Dark-first, one luminous accent, nothing static.

## Palette (source of truth: `apps/mobile/src/theme.ts`)

| Token | Hex | Use |
|---|---|---|
| ground | `#0a0d15` / `#0B0E16` | near-black indigo canvas |
| surface | `#151A26` | cards, inputs |
| accent | `#6C8CFF` | the one luminous periwinkle — spend boldness here |
| accent-light | `#A8BCFF` | highlights, active states |
| mist / ink gradient | `#eaf0ff → #b9c8ff → #6c8cff` | the vapor gradient (white→periwinkle) |
| text | `#F2F5FF` | |
| muted / faint | `#8A93A8` / `#5A6378` | secondary / labels |

QR tiles stay **white** (scanners need contrast) — the one deliberate exception
to dark-first, given a soft accent glow.

## Logo

- **Wordmark**: the **ribbon-W lockup** — a folded-ribbon `w` beside "aft" in
  a heavy geometric sans (tight tracking, vapor-gradient fill). The wordmark's
  ribbon uses a **lowercase-w silhouette** (symmetric tips on the x-line,
  wider stance, higher middle peak than the icon's W) so it reads as the "w"
  in "waft", not a capital. It's sized to the **x-height of "aft"** (+3%
  optical overshoot for the pointed, dissolving tips) and shares the
  baseline; the left flourish's dissolving tail fades in ~30% sooner so it
  doesn't out-gesture the letterforms. Measure x-height with canvas ink
  metrics (`actualBoundingBoxAscent`) — svg text `getBBox()` returns the em
  box, not ink. (Supersedes the earlier font-only wordmark.)
- **App icon**: a **folded-ribbon "W"** (Netflix-N technique) rendered as
  tapered, alpha-faded vapor ribbons — solid in the belly, dissolving at the
  tips. Sharp edges (no blur); wispiness is geometry, not softness. Adaptive:
  dark-ground (periwinkle→white W) for dark mode, periwinkle-ground (white W)
  for light mode. Legible to 46px.

## Motion language — "Coalesce"

The signature animation: the mark **condenses out of drifting turbulent vapor**
into crisp focus, then keeps *breathing* with low-amplitude turbulence so it's
never frozen; wispy tendrils draw on during the reveal and reappear at random
short intervals as ambient drift. Used for splash / loading / sign-in.

Prototype (all states + variants): the `waft-logo` artifact.
Web technique: SVG `feTurbulence` + `feDisplacementMap` (real smoke). App
technique: approximate with react-native-svg tapered paths + gradients +
Animated (feTurbulence isn't reliable in RN) — keep the *feel*, not the exact
turbulence.

Principles carried from the prototype: sharp geometry + alpha-fade for
wispiness (not blur); one accent doing the work; motion that serves the
"drifting/coalescing" meaning rather than decorates.

## Where this goes next (design intent, not yet built)

- **Network graph as the showcase surface.** Apply Coalesce to the graph
  itself: a **new node should condense in from vapor** (turbulent-in → settle)
  rather than pop, and a **new edge/waft should form as a drifting gust** that
  flows from one node to the other and settles into the line — so watching the
  graph grow feels like the room literally wafting together. The event wall is
  the highest-drama place for this (nodes appearing live as people check in).
- Extend the same palette + coalesce motion to onboarding, empty states, and
  transitions as surfaces get redesigned.

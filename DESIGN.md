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

- **Wordmark**: "waft" set in a heavy geometric sans, tight tracking, filled
  with the white→periwinkle vapor gradient. (Decided over the ribbon-`w`
  integration — the font weight reads cleaner; the ribbon lives in the icon.)
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

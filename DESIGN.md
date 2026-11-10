---
version: alpha
name: Underwarned
description: Forecast heat underprediction audit. Sunbleached, exact, quiet. The finding comes first.
colors:
  paper: "#F6F1E8"
  surface: "#FFFAF4"
  ink: "#1C1917"
  muted: "#534E47"
  line: "#D9D0C4"
  accent: "#C23B22"
  accent-deep: "#9B1D1D"
  gold: "#C4A035"
  success: "#2C6E4E"
  warn: "#9A5A12"
  forecast: "#3F5B73"
  on-accent: "#FFF8F0"
  on-ink: "#F6F1E8"
typography:
  display:
    fontFamily: Newsreader
    fontSize: 160px
    fontWeight: "500"
    lineHeight: 0.9
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: "500"
    lineHeight: 1.08
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: "500"
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 1.2
    letterSpacing: -0.015em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: 0em
  caption:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
    letterSpacing: 0em
  numeric:
    fontFamily: IBM Plex Mono
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: 0em
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 24px
  6: 32px
  7: 48px
  8: 64px
  9: 96px
rounded:
  sm: 2px
  md: 4px
  lg: 8px
---

# Underwarned design system

Underwarned is a forecast heat underprediction audit. It measures how often a 1 to 7 day GFS forecast (Open-Meteo Previous Runs) stayed too cool when ERA5 daily maximum heat crossed a chosen mark, in Phoenix, Houston, Madrid, and Delhi, across May to September 2024 and 2025.

This file is the source of truth for colour, type, space, components, charts, and motion. Every screen, state, and slide uses these tokens. No one-off hex, no untokenized type, no invented figures.

## Product and audience

- Material: computed city archives and the locked Phoenix 1 July 2024 miss (ERA5 40.7 °C, 3 day forecast 37.7 °C, shortfall 3.0 °C).
- Audience: DATANOVA judges first, then heat health planners and journalists.
- Job: open the audit and believe the miss. The first viewport must state the finding, in type, before any method recap.
- Tone: editorial, forensic, sunbleached, exact, quiet. A paper bulletin, not a SaaS dashboard.

## Precedence

Henry's brand in this file first. Then the Hallmark Floor. Then one MotionSites signature and two to four quiet supporting techniques. Then Emil Kowalski motion timings. Never a purple gradient, orb, blob, glassmorphism stack, or generic sidebar dashboard.

## Colour

Paper `#F6F1E8` is the page. Ink `#1C1917` is type and primary actions. Vermilion `#C23B22` is reserved for underprediction: the hero figure, the miss ribbon, missed labels, and shortfall. It is not a general brand wash and not a button fill (white on vermilion fails comfortable body contrast). Forecast marks use slate `#3F5B73`. The threshold tick is gold `#C4A035`. Hits and positive skill use forest `#2C6E4E`. Warnings use `#9A5A12`. Errors and deep emphasis use `#9B1D1D`. Muted `#534E47` is for captions of 13px and above; it is dark enough for AA on paper. Hairlines use `#D9D0C4`. Surfaces, when needed, are `#FFFAF4`, nearly paper, never a floating white card stack.

No purple, no glow orbs, no mesh gradients, no neon.

```yaml
colors:
  paper: "#F6F1E8"
  surface: "#FFFAF4"
  ink: "#1C1917"
  muted: "#534E47"
  line: "#D9D0C4"
  accent: "#C23B22"
  accent-deep: "#9B1D1D"
  gold: "#C4A035"
  success: "#2C6E4E"
  warn: "#9A5A12"
  forecast: "#3F5B73"
  on-accent: "#FFF8F0"
  on-ink: "#F6F1E8"
```

## Type

Two families, both OFL, self hosted from the app bundle, never requested from Google's servers.

- Display, wordmark, and section titles: Newsreader 400 and 500.
- Interface, body, and labels: IBM Plex Sans 400, 500, and 600.
- Figures, axes, and dates in tables: IBM Plex Mono 400.

The hero figure is architectural type: `clamp(88px, 16vw, 200px)`, Newsreader 500, line-height 0.9, letter-spacing -0.04em, vermilion. It is the first thing on the page. Headings are roman, never italic, never mixed italic, never uppercase, never tracked small caps, never an eyebrow above them. Body is 16/24, lede 18/28, measure about 62 characters on method and limitations. Captions are 13/18 in muted ink, not 11px grey.

Do not letter-space figures so that "11.2%" becomes "11 . 2 %".

## Spacing and shape

Eight-point grid: 4, 8, 12, 16, 24, 32, 48, 64, 96. Desktop page width is 1120px, centered, with 40px side padding (24px below 800px). Radius stays tight: 2px for ticks, 4px for chips, 8px for sheets. This is a journal, not a rounded-card product. Shadows are almost absent; structure comes from hairlines and type scale. Targets are at least 44px. Overflow wrap is anywhere. Grid columns use `minmax(0, 1fr)`. `html` and `body` use `overflow-x: clip`.

## Layout and navigation

The first viewport is a finding, a sentence, and actions. At 1280×800 the hero figure, the sentence, and both actions are visible without scrolling. About 80 words per screen; detail lives below the fold.

Desktop uses a sticky top masthead: Newsreader wordmark on the left, text links on the right (Audit, Events, Compare, Method). Active link is ink weight 600 with a 2px vermilion underline. No left sidebar. Limitations and legal live in the footer.

Mobile (800px and below) uses one bottom tab row with five items: Home, Audit, Events, Method, More. Icon-free text labels, 44px targets, safe-area padding, ink for the active tab. More opens a bottom sheet for Compare, Limitations, Legal, and Close. Never two rows of tabs. The masthead on mobile is the wordmark only.

Landing may go full-bleed typographically (the hero figure can approach the edges) but copy stays inside the 1120px measure.

## Signature and motion

Signature (one): the miss ribbon, a full-width temperature horizon. A vermilion band runs between the forecast daily maximum and the ERA5 daily maximum when the forecast was too cool. A gold tick marks the threshold. Forecast is a slate tick; observation is an ink tick. Large mono figures sit above the horizon, not inside a card. This is the instrument the product is remembered for.

Supporting techniques (quiet, from the MotionSites library):

1. Giant display type as architecture: the 11.2% hero figure.
2. Staggered blur-rise on first paint of the hero (figure, then line, then lede and actions).
3. Paper grain overlay at very low opacity, multiply, pointer-events none.
4. Sliding-fill on the primary action (ink wipe, 200ms ease-out).

Emil Kowalski timings: press 100 to 160ms, tooltip 125 to 200ms, dropdown and sheet 150 to 250ms, no transform from scale 0 (use 0.95 or 1). Ease out (`cubic-bezier(0.22, 1, 0.36, 1)`). No motion on high-frequency pointer travel. No `transition: all`. No animating width, height, top, or left (ribbon and bars use `transform: scaleX`). Keyboard users get an instant state, not a delayed animation.

`prefers-reduced-motion: reduce` sets transitions and animations to 1ms with no delay, stops the grain if it moves (it does not), skips blur-rise, and draws the ribbon and bars at their final scale immediately.

Tokens: `--dur-press` 140ms, `--dur-fade` 180ms, `--dur-sheet` 220ms, `--dur-hero` 620ms, `--ease-out` cubic-bezier(0.22, 1, 0.36, 1).

## Components

- Masthead and wordmark, as above.
- Primary button: ink fill, paper text, sliding fill on hover, press scale 0.97, 44px tall. Ghost button: hairline, ink text, faint paper fill on hover.
- Segmented filters (city, season, lead, threshold): typographic chips, not native selects. Active chip is ink with paper text. They wrap on small screens.
- Miss ribbon: described above. Caption names the day, city, and lead in a sentence, not as middle-dot meta.
- Lead chart: horizontal typographic bars, one row per lead, miss rate labeled at the end, shortfall and event count in the same row. Bars grow with `scaleX`, origin left, 520ms ease-out, staggered under 80ms, disabled when reduced motion or when the control is being clicked repeatedly. Empty leads show "n/a" and no bar.
- Hourly traces: ink line for ERA5, slate for the forecast, gold dashed threshold, gaps for missing hours (never zero-filled). Axes in mono. A short legend in words, not a colour key only.
- Event table: typographic, hairline rows, no enclosing card. Status is a word in colour (miss, hit, false alarm, incomplete), not a candy pill. Dates are links. Null shortfall is "n/a".
- City posters (home and compare): a top hairline, city name in Newsreader, one large figure, one sentence. A city with no events says so, and points to a lower threshold. Small samples (for example Madrid at 40 °C) always print the event count beside the rate.
- Banners: a left gold or vermilion hairline, paper background, no toast, no `alert()`.
- Loading: skeletons that match the hero or chart shape, opacity pulse, no shimmer travel if reduced motion.
- Empty, error, and partial: typographic, with a retry or a next action. Partial never invents a number; it labels the gap and still shows complete figures when they exist.
- Bottom sheet: paper, 8px top radius, 220ms ease-out translate, focusable Close.
- Footer: method, limitations, legal, model credit, generated timestamp. No middle-dot chains. DATANOVA 2026 and problem DN-OP-01 may be named here, not as a hero eyebrow.

## Chart style

Charts are typographic instruments. No default chart chrome, no grid of pale cards, no 3D, no rainbow. One accent colour for the miss series. Direct labels over legends where they fit. Axes start at zero for rates. Tooltips (180ms fade, ease-out, scale 0.98) repeat the same figures in a sentence. Every number on a chart comes from the computed JSON.

## Copy

No placeholder text, no lorem, no emoji icons, no decorative status dots, no arrows glued to links, no dashes used as punctuation, no "DATANOVA 2026 · DN-OP-01" eyebrow. User-facing prose uses "and" or a new sentence instead of a dash. Day 0 is never called an observation. ERA5 is the reanalysis observation, never an airport thermometer. Headline rates are always conditional on events and printed with their counts.

## States and access

Every route has loading, empty, error, partial, and success treatments. Judges can open `?demo=loading|empty|error|partial`. Real empty results (Madrid at 45 °C, Houston at 40 °C) use the same empty treatment. Skip link, `lang="en"`, visible `:focus-visible` (2px vermilion offset), text resize to 200%, contrast AA, a real 404, title and meta, favicon, Open Graph image. No `alert()`.

## References used

- Hallmark Floor: tokens only, no `transition: all`, `overflow-x: clip`, no eyebrow, no tracked capitals, no purple, no card-in-card, hero headline plus sentence plus action visible at 1280×800, about 80 words per screen, stamp at the top of CSS, sloplint.
- MotionSites technique library: giant display type as architecture; miss ribbon as the signature instrument; blur-rise, grain, and sliding-fill as supporting moves. Not a video-glass hero (wrong genre).
- Emil Kowalski motion rules, as timed above.
- Approved plan palette and mood (sunbleached, exact, quiet), upgraded: tighter radius, darker muted text, masthead instead of a sidebar, finding-first hero, custom filters, typographic charts.
- Prior approved work (LANDFALL, FIRMFIX): token discipline, display type as the first frame, custom motion, honest empty states. Those palettes are not reused; Underwarned stays paper and vermilion.

## What this system rejects

A left sidebar with a rounded white active pill, native `<select>` filters, a product-name hero, a buried 11.2% in a small card, generic metric card grids, candy status pills, thin unlabelled SVG bars, tracked uppercase labels, and any copy that opens on the contest name instead of the finding.

# Underwarned DESIGN.md

Product: Underwarned, a forecast heat underprediction audit.
Audience: judges first, then heat health planners and journalists.
Mood: sunbleached, exact, quiet.
Signature: the miss ribbon (vermilion shortfall between forecast and observed daily maximum).

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| Background | #F6F1E8 | Page |
| Surface | #FFFFFF | Cards |
| Text | #1C1917 | Ink |
| Muted | #6B645C | Captions |
| Accent | #C23B22 | Miss ribbon, underprediction |
| Secondary | #D4A017 | Threshold ticks |
| Success | #2C6E4E | Hits, positive skill |
| Warn | #C5761A | Partial data |
| Danger | #9B1D1D | Errors |
| Forecast | #3F5B73 | Forecast marks |

No purple, no glow orbs, no blobs.

## Type

- Display and wordmark: Newsreader, self hosted, clamp(40px, 6vw, 64px)
- H1 32/40, H2 24/32 Newsreader
- Body: IBM Plex Sans 16/24, self hosted
- Numbers: IBM Plex Mono

## Motion

- Miss ribbon: 300 ms ease out, starts from scale 0.95
- Button press 120 ms, tooltips 160 ms
- No motion on city or lead switches triggered repeatedly
- prefers-reduced-motion: snap, no ribbon animation
- Entrance under 1.5 s

## Layout

- Desktop: left sidebar
- Mobile: one bottom tab row (Audit, Events, Method, More)
- 8 px grid, 12 px card radius, 44 px targets, skip link, real 404

## References used

collected.li and arche.directory for editorial bulletin structure; shadcn-like filter and table patterns implemented by hand; Emil Kowalski motion timings; Hallmark-style clean paper with one signature.

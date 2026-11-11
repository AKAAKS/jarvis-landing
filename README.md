# JARVIS — landing page

The public front door for [JARVIS](https://github.com/AKAAKS/personal-assistant),
a voice and text assistant built on Claude's tool-use loop. React + Vite, static
output, no backend.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/  (static, deploy anywhere)
npm run preview  # http://localhost:4173, serves dist/
npm run og       # regenerate public/og.png (needs preview running)
```

Deploy `dist/`. For GitHub Pages under a sub-path, set `base: '/<repo>/'` in
`vite.config.js`.

## Where things live

| What | Where |
|---|---|
| All copy, links, the integration map, the stats | the consts at the top of `src/App.jsx` |
| Colour, type and layout tokens | `:root` in `src/styles.css` |
| The WebGL orb | `src/orb/` |
| og:image generator | `scripts/make-og.mjs` |

## The numbers are measured, not written

The stats row, the tool list and the test count are claims a reader can check
against the JARVIS repo, so they are derived from it rather than typed from
memory. They were last verified on 2026-11-11 against `personal-assistant@bc914ea`
(master):

```bash
# tests — 1092
python -m pytest --collect-only -q | tail -1

# tools — 72. Import the modules; do NOT grep for '"name":', because nested
# JSON-schema properties carry a name key too and that overcounts to 88.
python -c "
import importlib
mods='ha spotify system terminal clipboard tv files memory reminders rules \
meals food pantry meal_log suggest prep proposals gmail calendar weather'.split()
print(sum(len(importlib.import_module('jarvisd.tools.'+m).TOOLS) for m in mods))"
```

`TOOL_COUNT` and the surface count in `App.jsx` are computed from the
`INTEGRATIONS` array, so the stats row cannot drift from the map below it. If
you add a surface, only the array changes.

## Things that will bite you

- **The orb is seeded** (`src/orb/rng.js`). Two loads must produce the identical
  object, because `public/og.png` is a photograph of it. Changing `ORB_SEED`
  means regenerating the card.
- **`coreGeo` needs a `position` attribute** even though the core shader reads
  `aFrom`/`aTo` and never touches it. three.js derives the draw count from it
  and silently renders nothing without it.
- **`npm run og` must not force SwiftShader.** WebGL works there, but the
  `<Bloom>` pass fails under it and blanks the whole canvas, which looks like
  WebGL being off and sends you debugging the wrong thing.
- **The orb stands beside content, never behind it.** `OFFSETS` in
  `src/orb/Orb.jsx` say where the orb's **inner edge** sits, as a signed
  fraction of the visible half-width — not where its centre sits. The camera's
  visible height is fixed but its visible width scales with the viewport's
  aspect, while the globe's radius is a fixed world value, so positioning by
  centre still lets the orb eat further into the column as the window narrows.
  `x = sign * (|edge| * halfWidth + radius)`, resolved against the measured
  viewport each frame.
- **`edge` is nominal; the drawn orb is wider.** Nodes sit out to `radius*1.03`,
  the rings sit outside them and Bloom spreads further again — about 7 points of
  screen width past `GLOBE_R` at 16:9, and MORE as the viewport narrows. Budget
  for it when tuning.
- **Tune a wide beat's edge at the NARROW end of the range.** The pipeline is a
  fixed 860px, so the share of the screen it occupies grows as the window
  shrinks (68.9% at 1425px, 74.9% at 1185px) while the orb's edge fraction
  stays put. A value tuned only on a big monitor overlaps content on a smaller
  one.
- **Interpolate the resolved x values, never `edge` itself.** `edge` passes
  through zero at the crossing and `Math.sign(0)` would snap the orb by a whole
  radius.
- **On mobile the orb gets a band of its own** above the headline, sized to be
  seen WHOLE (`MOBILE_SCALE` 0.41 at y 1.25 = 8.4%-41.3% of the viewport). It
  used to be big and cropped, reading as a severed half stuck under the nav.
  `#top.beat`'s mobile `padding-top` reserves that band and must move with it.
- **Screenshots need `height: auto`.** Every `<img>` carries explicit width and
  height attributes for intrinsic sizing. Without `height: auto` the height
  ATTRIBUTE becomes the used height while `width: 100%` sets the width, and
  each one is silently drawn off its true aspect ratio.
- **Crop screenshots to their content before adding them.** `audit.png` was
  1905px wide with only ~690px of it carrying anything; squeezed into a 600px
  column that put the log text at 31% and made it unreadable.
- **`beatRef` holds a FLOAT**, not an index: beat number plus progress toward
  the next, so the orb interpolates between placements instead of snapping. The
  orb rests at its offset for the first 62% of a beat and travels during the
  last 38%; interpolating across the whole beat means it never actually reaches
  any designed placement. The core morph is driven by scroll progress and is
  independent of this.
- **The orb path has exactly one reversal, at the gate.** Each extra reversal
  drags it across the full width behind whatever you are reading. This is why
  `open` is right-aligned: bookending with the orb back on the right would cost
  a full-width sweep behind the closing content.
- **Mobile fades the orb on scroll distance, not on beat index.** The phone hero
  is taller than the viewport, so the reader scrolls through the orb's band
  while still on beat 0; a per-beat gate leaves the limb over the lead
  paragraph for the whole first screenful.
- **Ruled tables draw top+left on the container and right+bottom on each cell.**
  Any other split needs `nth-child` corrections that break the moment a cell
  spans two columns — which the register's total row does.
- **A pipeline step's wrapper is `stage ${kind}`,** so the verdict step carries
  class `"stage verdict"` and will match a bare `.verdict` selector. Chip rules
  must be scoped to `.stage-body`.
- **Check 390px as well as desktop.** A `::before` scrim once added 16px of
  horizontal scroll that no element query could find, because a pseudo-element
  has no node to measure.

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
  `src/orb/Orb.jsx` are **fractions of the visible half-width**, not world
  units. The camera's visible height is fixed but its visible width scales with
  the viewport's aspect, so a world offset tuned on a 16:9 monitor slides off
  frame entirely at 4:3. The value is multiplied by `state.viewport.width / 2`
  each frame.
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

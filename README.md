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
  `src/orb/Orb.jsx` is derived from the camera's visible half-height
  (`tan(22.5°) × 6 = 2.49` world units), not eyeballed. Mobile uses a single
  fixed offset because full-width panels leave no free half to stand in.
- **Check 390px as well as desktop.** A `::before` scrim once added 16px of
  horizontal scroll that no element query could find, because a pseudo-element
  has no node to measure.

# JARVIS — landing page

The public front door for [JARVIS](https://github.com/AKAAKS/personal-assistant),
a voice assistant that runs on my own PC. React + Vite, static output, no
backend, no WebGL.

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

## The conceit

**The page is the machine's own record of three things it did.** Not a
description of a product: a record, with the real timestamps and permission
verdicts left in.

Everything else is derived from that one decision, and the derivation is the
whole point. The previous version of this page was built around a glowing WebGL
orb, which could not answer "what is a card?", "what colour is a shadow?" or
"how do sections join?" — so those were invented, and an invention defaults to
whatever looks generically nice. That is where the generated look came from.
From the record you instead get:

| Question | Answer |
|---|---|
| What is a section? | A turn, or a set of turns, out of the logs |
| What is a heading? | The same dim grey as log output. Emphasis is weight and space |
| What gets colour? | Only what the daemon itself assigns meaning to: a permission verdict, a refusal, the on-device tier |
| What is brightest? | What I said. Machine output sits a step below it |
| How do sections join? | A timestamp. The record is continuous |
| What does scroll do? | Advances time through the record, without ever intercepting the scroll |

## Where things live

| What | Where |
|---|---|
| The three readouts, line by line | `RECORD` in `src/data/record.js` |
| Surfaces, stats, guard claims, copy | the rest of `src/data/record.js` |
| Colour, type and layout tokens | `:root` in `src/styles.css` |
| The scroll playback | `src/readout/usePlayback.js` |
| og:image generator | `scripts/make-og.mjs` |

## The record is transcribed, not written

Every line of every readout is copied out of a real log file in
`personal-assistant`. Nothing in them was composed for the page. Three files
are involved:

```
logs/voice_client.log   wake word, "Listening...", capture length
logs/jarvisd.log        "Heard: ...", "Routing to ...", "Audio in: ..."
logs/audit.jsonl        tool, input, verdict, reason, result_preview
```

To re-derive or extend them:

```bash
cd ../personal-assistant

# the spoken side, with the routing decision
grep -nE 'Heard:|Routing to|Audio in' logs/jarvisd.log

# the tool calls, with their permission verdicts
grep -iE 'open_url|close_app|gmail' logs/audit.jsonl
```

The two files are joined on the clock. `jarvisd.log` prints local wall-clock
with no date; `audit.jsonl` stores UTC ISO-8601. The conversions used for the
lines currently on the page are written out at the top of `src/data/record.js`.

## The numbers are measured, not written

Last verified 2026-11-11 against `personal-assistant@bc914ea` (master):

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

`TOOL_COUNT` and the surface count are computed from the `SURFACES` array, so
the stats row cannot drift from the register below it.

## Things that will bite you

- **No line on a readout may be invented.** The daemon logs what it *heard* but
  never what it *said*, and the client's rotating log does not retain these
  turns, so the readouts stop at the tool result rather than carry a
  reconstructed reply. If a terminal capture ever lands, add `{ k: 'reply' }`
  lines and they render. Do not write one from memory.
- **`gmail_draft` has never run.** It is in the registry and unit-tested
  against a fake client, so a glance at `jarvisd/tools/gmail.py` makes it look
  live — but `grep -c gmail_draft logs/audit.jsonl` returns **0**. No draft has
  ever been written to the real account; the Gmail OAuth compose path is
  untested. Every real Gmail call is a `gmail_search` or a `gmail_read`. The
  reply reaches the user through `set_clipboard`, which is a **This PC** tool,
  not a Gmail one. Do not write copy implying a draft lands in Gmail, and do
  not ask for a Drafts screenshot. An earlier draft of this page did both.
- **A readout line may be cut, never rewritten.** One `heard` line in the mail
  moment contains an email address and is cut at `… [address redacted]`. The
  cut must stay visible. Trimming is honest; paraphrasing a log line is not.
- **The merge is the page's, and it says so.** No screen in the real system
  shows those three files interleaved. Every moment carries a line naming the
  files it was transcribed from; if you add a moment, add that line too.
- **`rl-gap` is the only non-log line in a readout** — the page's own aside
  between turns. It is deliberately set in the body face, italic, and out of
  the timestamp column so it can never be mistaken for machine output. Keep it
  visually distinct from everything around it.
- **The scroll playback is monotonic on purpose.** `maxRef` only increases, so
  a revealed line never hides. That is what makes flicking to the footer safe:
  a fast scroller cannot end up with less of the page than a slow one. Do not
  "fix" it to hide lines on the way back up.
- **Nothing intercepts the scroll.** No wheel, touch or key handler, no
  `scrollTo`, no rate limiting. The stage is `position: sticky` inside a tall
  track, which pins visually while the page keeps scrolling 1:1.
- **Tune the track height by measuring, not by eye.** The scrollable remainder
  is `track height − 100vh`. At 140vh that was ~256px on a laptop, which put a
  twelve-line readout inside two wheel notches and read as a flicker. It is
  190vh now. Step the track at 0/.15/.3/… and count `.rl.is-on`.
- **Playback is gated on FIT, not just width.** `usePlayback` refuses to play
  a readout taller than the viewport, because the stage is sticky and exactly
  100vh: lines past the fold would be unreachable. This is per moment, so at
  1200x520 the two short readouts still play while the 17-line mail readout
  falls back to static. A width test alone cannot catch this -- 1366x600 is
  plenty wide and far too short.
- **Playback is off below `MIN_WIDTH` (880px) and under
  `prefers-reduced-motion`.** In both cases the track loses its extra height,
  the stage stops sticking, and every line prints at once. Check both: they
  are the paths most readers get.
- **Do not measure the reveal with short sleeps.** The hook updates inside
  `requestAnimationFrame`, which a browser throttles when the tab is not
  focused, so a scroll-and-sample loop at 120-300ms reports a stuttering
  `1,1,1,7,7,7` and looks exactly like a broken reveal. At 1000ms the counts
  match `ceil((p / 0.82) * n)` exactly. Verify the scroll actually landed
  (`scrollY` vs target) before believing a reveal bug.
- **Ruled tables draw top+left on the container and right+bottom on each cell.**
  Any other split needs `nth-child` corrections that break the moment a row
  wraps.
- **Divide the cell count by the column count before you pick a grid.** 13
  surfaces over a 4-column auto-fit left three dead cells and the border
  stopped mid-row; it is a row list now. 8 guard items are pinned to 2 columns
  for the same reason — auto-fit gave 3 and left one cell empty.
- **Screenshots need `height: auto`.** Every `<img>` carries explicit width and
  height attributes for intrinsic sizing. Without `height: auto` the height
  ATTRIBUTE becomes the used height while `width: 100%` sets the width, and the
  image is silently drawn off its true aspect ratio. This bit all three images
  on the previous version.
- **Crop screenshots to their content before adding them.** A 1905px-wide
  capture with ~690px of actual content, squeezed into a 600px column, put its
  text at 31% and made it unreadable.
- **Check 390px as well as desktop.** A `::before` scrim once added 16px of
  horizontal scroll that no element query could find, because a pseudo-element
  has no node to measure.
- **`npm run og` needs the preview server up.** It photographs the real page at
  `localhost:4173`; a hand-drawn card would be a second copy of the same thing
  and would drift from the page silently.

## Pending

Figures live in `shots` on each moment in `src/data/record.js`, and render as
labelled placeholders until a real `src`, `w` and `h` are filled in.

- [x] **The bus / catabus.com** — `public/catabus.jpg`, cropped from a
      1868x965 capture to 1300x965 (logo, full route list, map through State
      College) and resized to 1192px, which is 2x its widest display size.
- [ ] **The bus / Maps** — the Maps tab with the walking route from my
      coordinates to Crunch Fitness, walk time visible.
- [ ] **The mail** — the composed reply pasted into a blank compose window.
      It must be the *clipboard* text, verbatim, with no greeting, sign-off or
      Gmail "Polish" rewrite: the readout quotes the logged `set_clipboard`
      input directly above the figure, so any difference is visible. Redact
      the recipient.
- **The machine (02) needs no figure and must not get one.** See the comment
  on its `shots: []`.

## Things this rework decided that are easy to undo by accident

- **Figures are NOT in the sticky stage.** They were, as a second column, and
  that column was 286px. A 1868px browser screenshot at 286px is a 15% scale
  smear. They now sit in `.figs` below the track, in normal flow, with no
  height ceiling. Putting them back in the stage re-breaks this, and a moment
  with two figures cannot fit beside a readout in 100vh at a legible size.
- **A single figure is capped at 720px** (`.figs[data-n="1"]`). At the full
  1012px measure a screenshot outweighs the readout it illustrates.
- **`aspectRatio` is for placeholders only.** A real `<img>` carries its own
  intrinsic ratio via its width/height attributes; setting a ratio on the
  `<figure>` as well cropped the image inside `overflow: hidden`.

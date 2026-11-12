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
| What gets colour? | Only what the daemon itself assigns meaning to: a permission verdict, a refusal, the routing tier, and which log file a line came from |
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
- **Playback needs viewport HEIGHT, and the thresholds are small.** The fit
  gate switches a readout to static when it is taller than
  `innerHeight - 56`. Measured: moment 01 needs a **597px** window, 03 needs
  560, 02 needs only 399. A 1366x768 laptop sits right on the line, so the
  same page can play one moment and print the other two. If someone reports
  "it does not fade", ask for `innerHeight` before touching the code.
- **`maxRef` never resets without a reload.** Reveal is monotonic by design,
  so once a readout has been scrolled past it stays fully printed for the
  rest of that page session -- scrolling back up will not replay it. This is
  correct, and it also invalidates any test that scrolls the same track
  twice. Reload between runs or you will measure your own previous scroll.
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

All figures are in. Nothing on the page renders as a placeholder.

## Redactions on the page

Two, both visible, both required. A readout line may be **cut, never
rewritten**:

- The 30 October Maps URL carried my real latitude and longitude where a place
  name would go. It reads `[my coordinates]` now. Re-check with
  `grep -rn "40\.8154" src/ dist/`.
- No email address appears anywhere. The 12 November mail turn was moved to a
  dictation that contains none; check with a scan of the rendered text, not
  the source, since the readout composes lines from several fields.

## Which branch the record was recorded on

The readouts were captured while `personal-assistant` had
`fix/voice-verification-and-echo` checked out, not `master`. Every string the
page quotes -- `Heard:`, `Audio in:`, `Routing to`,
`Utterance rejected -- not the enrolled speaker` -- exists on `master` too, so
the record is faithful to the shipped code; the branch retunes thresholds, not
log lines. Two client strings are branch-only and must NOT appear on the page:
`Barge-in accepted: score ...` and `Ignored utterance ...`. Check before
quoting a new line:

```bash
git grep -c "<the string>" master -- '*.py'
```

## Claims that were wrong, and how they got caught

The 12 November session contradicted three things the page asserted. All three
came from building a moment out of one good day's logs and assuming it
generalised. Re-read the logs before adding a capability claim.

- **Directions were never a regression, and are now granted outright.** On 30
  October it built `/maps/dir/<coords>/Crunch+Fitness...`; on 12 November the
  same request opened `maps.google.com` and nothing else. Neither was a code
  change: the prompt never granted the capability, so October was improvisation
  that a clean context reproduced ~4 times in 5 and a context containing its own
  "I can only open URLs" reproduced 0 times in 5 -- and `_load_history` restores
  20 turns at startup, so that refusal reloaded after every restart.
  `personal-assistant@aea445b` states the capability in the prompt instead;
  it is in `SOLID` now. **It still cannot report travel time** -- there is no
  duration tool anywhere in `jarvisd/tools/`, and the capability text tells it
  to let the user read the time off the map. Do not write copy implying an ETA,
  approximate or otherwise; a spoken guess is not logged and not checkable.
- **The transit site is `realtime.catabus.com`.** The page quoted
  `www.catabus.com` from an older turn while the screenshot showed the real
  one. It took four wrong URLs to find it.
- **`gmail_draft` has never run.** See the entry below.
- **Barge-in is NOT "on a branch".** It merged to `master` on 2026-10-25 in
  `1be9f6c`, live-validated, and `git merge-base --is-ancestor 1be9f6c
  origin/master` confirms it. The branch that is still unmerged,
  `fix/voice-verification-and-echo`, is eight commits of *tuning* for
  verification and the echo gate -- not the feature. Do not conflate them.

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
- **Full-bleed sections are done with padding, never `100vw`.** `main` has no
  max-width; each section runs the full width and holds its content on the
  measure with
  `padding-inline: max(var(--gut), calc((100% - var(--maxw)) / 2))`.
  `width: 100vw` includes the scrollbar and is exactly how this page got 16px
  of phantom horizontal scroll once already.
- **The banded ground is the section's own background**, set by
  `main > *:nth-child(even)`. It is not an element behind the content, which
  is what keeps the "nothing lives behind the content" rule intact. Adding a
  real background layer breaks that rule, and the orb is why the rule exists.
- **The moment slug IS the legend for the provenance tints.** `.slug-file`
  and `.rl-src` must resolve to the same two tokens. If they ever drift, the
  tints in the source column go back to being decoration that happens to be
  data, because nothing else on the page says what tan and mauve mean. Check
  by computed colour, not by eye.
- **Derived views compute from `RECORD`, never from a written-down number.**
  The hero index and the moment slugs both go through
  `src/readout/derive.js`. Adding a line to a moment must move every count
  on the page by itself. Writing "20 lines" anywhere is how it starts
  drifting.

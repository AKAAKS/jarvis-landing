import { useEffect, useRef, useState } from 'react'

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

/* Lines are revealed over the first REVEAL_OVER of the track's travel; the
 * remainder holds the complete readout on screen before the section releases.
 * Without the hold, the last line appears exactly as the section scrolls away
 * and is never actually read. */
const REVEAL_OVER = 0.82

/* Playback is off below this width, and the reason is CORRECTNESS, not taste.
 *
 * On a phone the readouts are taller than the phone. Measured at 390px wide:
 * moment 01 is 938px tall and moment 03 is 840px, against a phone viewport of
 * roughly 660-780. The stage is sticky and exactly 100vh, so playing there
 * would pin the stage and reveal lines into a region below the screen edge
 * that scrolling cannot reach -- scrolling advances the REVEAL, not the stage.
 *
 * The fit guard below already refuses those two on its own. This width gate
 * exists because moment 02 is only 380px at that width and WOULD pass the fit
 * guard, so without it a phone would play one moment and print the other two,
 * with nothing on screen to explain the difference. Mobile is uniformly
 * static instead.
 *
 * Do NOT lower this because the wrapping looks acceptable at some width. The
 * wrapping was never the reason; the unreachable lines are. */
const MIN_WIDTH = 880

/* The real guard is height, not width. The stage is sticky and exactly 100vh,
 * so if the readout is taller than the viewport its bottom lines can never be
 * scrolled to -- they are simply unreachable. That is viewport HEIGHT
 * dependent, which a width test cannot catch: 1366x600 is wide enough and far
 * too short. So playback also requires the readout to actually fit, with a
 * margin for the sticky stage's own padding. */
const FIT_MARGIN = 56

/* -----------------------------------------------------------------------------
 *  Scroll-driven playback of a readout.
 *
 *  Two rules, both of them the reason this is safe to put on a page a recruiter
 *  will skim:
 *
 *  1. REVEAL IS MONOTONIC. `maxRef` only ever increases, so a line that has
 *     been shown is never hidden again. Flicking to the footer and scrolling
 *     back leaves every readout fully printed, and a fast scroller cannot end
 *     up with less of the page than a slow one.
 *  2. NOTHING IS INTERCEPTED. No wheel, touch or key handler, no scrollTo, no
 *     rate limiting. The page scrolls 1:1 at all times; this only reads
 *     getBoundingClientRect and decides how many lines are visible.
 *
 *  Returns [shown, playing]. When `playing` is false -- narrow viewport, a
 *  readout taller than the viewport, reduced motion, or a track shorter than
 *  the viewport -- `shown` is the full count from the first render and the
 *  caller renders a static, complete readout.
 * -------------------------------------------------------------------------- */
export function usePlayback(trackRef, count) {
  const [shown, setShown] = useState(count)
  const [playing, setPlaying] = useState(false)
  const maxRef = useRef(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let raf = 0

    const measure = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const travel = r.height - window.innerHeight
      if (travel <= 0) return
      const p = clamp01(-r.top / travel)
      const n = Math.min(count, Math.ceil((p / REVEAL_OVER) * count))
      if (n > maxRef.current) {
        maxRef.current = n
        setShown(n)
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    const sync = () => {
      // Measured on the readout, not the stage: the stage is forced to 100vh
      // while playing, so measuring it would always "fit" and prove nothing.
      const ro = el.querySelector('.readout')
      const contentH = ro ? ro.scrollHeight : 0
      const fits = contentH > 0 && contentH <= window.innerHeight - FIT_MARGIN
      const ok = window.innerWidth >= MIN_WIDTH && fits && !reduce?.matches
      setPlaying(ok)
      if (ok) {
        // Start from whatever the current scroll position already justifies,
        // so arriving by anchor or reload mid-section does not show an empty
        // frame. maxRef is never lowered, so this can only ever add lines.
        setShown(maxRef.current)
        measure()
      } else {
        maxRef.current = count
        setShown(count)
      }
    }

    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', sync)
    reduce?.addEventListener?.('change', sync)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', sync)
      reduce?.removeEventListener?.('change', sync)
    }
  }, [trackRef, count])

  return [shown, playing]
}

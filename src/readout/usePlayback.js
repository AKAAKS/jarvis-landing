import { useEffect, useRef, useState } from 'react'

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n)

/* Lines are revealed over the first REVEAL_OVER of the track's travel; the
 * remainder holds the complete readout on screen before the section releases.
 * Without the hold, the last line appears exactly as the section scrolls away
 * and is never actually read. */
const REVEAL_OVER = 0.82

/* Below this width the playback is off entirely, and it is NOT the phone
 * breakpoint -- it is the width at which the figures get their own column
 * (see the 1040px rule in styles.css). In a single-column stage the readout
 * and the figure stack, the stage grows taller than the sticky viewport, and
 * its bottom is simply cut off with no way to scroll to it. Keep these two
 * numbers equal. */
const MIN_WIDTH = 1040

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
 *  Returns [shown, playing]. When `playing` is false -- narrow viewport,
 *  reduced motion, no IntersectionObserver-era browser, or a track shorter
 *  than the viewport -- `shown` is the full count from the first render and the
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
      const ok = window.innerWidth >= MIN_WIDTH && !reduce?.matches
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

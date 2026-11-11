/* Seeded PRNG for the orb.
 *
 * Everything the orb is built from used bare Math.random(), so every page load
 * produced a different object: different cluster centres, different link graph,
 * different core jitter. That quietly says the shape means nothing — a drawing
 * does not reshuffle itself between viewings. One fixed seed makes the orb a
 * specific object that can be recognised, screenshotted, and regression-tested.
 *
 * mulberry32: 32-bit state, passes gjrand on small samples, ~5 lines. Any PRNG
 * would do; this one is chosen for being short enough to read in one glance.
 */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* The seed itself is arbitrary, but it must stay fixed: changing it redraws the
 * orb and invalidates the checked-in og:image, which is a photograph of it. */
export const ORB_SEED = 0x4a41525620 // "JARV " in hex, so it is obvious it was chosen, not tuned

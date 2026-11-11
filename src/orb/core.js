/* Central "mind core": a small particle formation inside the data-globe that
 * morphs between a set of shapes as you scroll (one shape per section), each
 * with its own accent colour. Returns all shape target buffers (same count),
 * blended two-at-a-time in the vertex shader via aFrom/aTo + uProgress. */

import { mulberry32, ORB_SEED } from './rng.js'

const TAU = Math.PI * 2
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

// Seeded: the core must be the same object on every load. See rng.js.
// Offset from the globe's seed so the two aren't correlated.
let rnd = mulberry32(ORB_SEED ^ 0x9e3779b9)

function sphere(n, r) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const rad = Math.sqrt(Math.max(0, 1 - y * y))
    const t = GOLDEN * i
    a[i * 3] = Math.cos(t) * rad * r
    a[i * 3 + 1] = y * r
    a[i * 3 + 2] = Math.sin(t) * rad * r
  }
  return a
}

function torus(n, R, r) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = (i / n) * TAU * 7 % TAU + rnd() * 0.3 // wrap for even spread
    const v = rnd() * TAU
    const rr = R + r * Math.cos(v)
    a[i * 3] = rr * Math.cos(u)
    a[i * 3 + 1] = r * Math.sin(v)
    a[i * 3 + 2] = rr * Math.sin(u)
  }
  return a
}

function helix(n, rad, h, turns) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const strand = i % 2 === 0 ? 0 : Math.PI
    const tt = i / (n - 1)
    const ang = tt * TAU * turns + strand
    const jitter = (rnd() - 0.5) * 0.06
    a[i * 3] = Math.cos(ang) * rad + jitter
    a[i * 3 + 1] = (tt - 0.5) * h
    a[i * 3 + 2] = Math.sin(ang) * rad + jitter
  }
  return a
}

function cloud(n, r) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    let x, y, z, l
    do {
      x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1
      l = Math.hypot(x, y, z)
    } while (l > 1 || l < 1e-3)
    const rr = r * (0.35 + 0.65 * Math.cbrt(rnd()))
    a[i * 3] = (x / l) * rr
    a[i * 3 + 1] = (y / l) * rr
    a[i * 3 + 2] = (z / l) * rr
  }
  return a
}

export function buildCore(n = 2800) {
  rnd = mulberry32(ORB_SEED ^ 0x9e3779b9)
  // one state per beat: hero · listen · act · reach · guard · state · open
  const shapes = [
    sphere(n, 0.85),          // 0 hero   — awake sphere
    torus(n, 0.72, 0.2),      // 1 listen — waveform ring
    helix(n, 0.5, 1.55, 3),   // 2 act    — processing helix
    cloud(n, 1.05),           // 3 reach  — data cloud / constellation
    sphere(n, 0.42),          // 4 guard  — tight sealed core
    sphere(n, 0.68),          // 5 state  — settling sphere
    sphere(n, 0.85),          // 6 open   — calm steady sphere (loops back to hero)
  ]
  // Accent colour per beat, taken from the page's own signal vocabulary rather
  // than chosen for variety — these are the same values styles.css uses for
  // --live, --accent, --tier-escalated and --verdict-pass, so the orb says the
  // same things the content does.
  //
  // The two colours that went: #49d4ff (cyan) at reach and #b981ff (violet) at
  // guard. Neither named anything in the system, and the cyan one rendered as
  // a flat blue rectangle behind the integration cards that read as a graphics
  // glitch rather than a decision.
  const colors = [
    '#ffcf5a', // 0 hero   — --live: awake
    '#ffcf5a', // 1 listen — --live: still awake, now listening
    '#ff5e3a', // 2 act    — --tier-escalated: the loop choosing a model
    '#ff9a2e', // 3 reach  — --accent: reaching across surfaces
    '#9fe6b0', // 4 guard  — --verdict-pass: the same green the page prints on
               //            an allowed read_only call
    '#ff9a2e', // 5 state  — --accent: settling
    '#ffcf5a', // 6 open   — --live, back where it started
  ]

  const aRnd = new Float32Array(n)
  const aScale = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    aRnd[i] = rnd()
    aScale[i] = 0.7 + rnd() * 0.7
  }
  return { shapes, colors, aRnd, aScale, count: n }
}

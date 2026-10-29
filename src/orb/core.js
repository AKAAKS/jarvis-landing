/* Central "mind core": a small particle formation inside the data-globe that
 * morphs between a set of shapes as you scroll (one shape per section), each
 * with its own accent colour. Returns all shape target buffers (same count),
 * blended two-at-a-time in the vertex shader via aFrom/aTo + uProgress. */

const TAU = Math.PI * 2
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

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
    const u = (i / n) * TAU * 7 % TAU + Math.random() * 0.3 // wrap for even spread
    const v = Math.random() * TAU
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
    const jitter = (Math.random() - 0.5) * 0.06
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
      x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1
      l = Math.hypot(x, y, z)
    } while (l > 1 || l < 1e-3)
    const rr = r * (0.35 + 0.65 * Math.cbrt(Math.random()))
    a[i * 3] = (x / l) * rr
    a[i * 3 + 1] = (y / l) * rr
    a[i * 3 + 2] = (z / l) * rr
  }
  return a
}

export function buildCore(n = 2800) {
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
  // accent colour per beat (warm-dominant, cool data/guard pops the user approved)
  const colors = ['#ffcf5a', '#ff9a2e', '#ff5e3a', '#49d4ff', '#b981ff', '#ffb24d', '#ffcf5a']

  const aRnd = new Float32Array(n)
  const aScale = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    aRnd[i] = Math.random()
    aScale[i] = 0.7 + Math.random() * 0.7
  }
  return { shapes, colors, aRnd, aScale, count: n }
}

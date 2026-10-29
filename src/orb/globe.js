/* Structured "data globe": tilted orbital rings (lines) + clustered node points
 * + short links between nearby nodes. Every vertex carries its cluster's drift
 * PHASE, so all particles in a cluster move together as one section (GPU-side,
 * no per-frame CPU work). Rings carry aDrift=0 so they stay structural.
 *
 * Returns typed-array attribute sets for three <points> / <lineSegments>. */

const TAU = Math.PI * 2
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

function fib(i, n) {
  const y = 1 - (i / (n - 1)) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const t = GOLDEN * i
  return [Math.cos(t) * r, y, Math.sin(t) * r]
}
const g3 = () => Math.random() + Math.random() + Math.random() - 1.5 // ~gaussian

function ringPoint(a, rad, tiltX, tiltY) {
  let x = Math.cos(a) * rad, y = Math.sin(a) * rad, z = 0
  let y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX)
  let z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX)
  y = y1; z = z1
  let x2 = x * Math.cos(tiltY) + z * Math.sin(tiltY)
  let z2 = -x * Math.sin(tiltY) + z * Math.cos(tiltY)
  return [x2, y, z2]
}

export function buildGlobe({ radius = 2, clusters = 24, nodesPerCluster = 55, rings = 7 } = {}) {
  const centers = []
  const phases = []
  for (let c = 0; c < clusters; c++) {
    centers.push(fib(c, clusters))
    phases.push([Math.random() * TAU, Math.random() * TAU, Math.random() * TAU])
  }

  // ---- nodes ----
  const nodes = [] // {x,y,z,c}
  const nPos = [], nPhase = [], nScale = [], nRnd = [], nDrift = []
  const addNode = (x, y, z, c, scale) => {
    nodes.push({ x, y, z, c })
    nPos.push(x, y, z)
    nPhase.push(phases[c][0], phases[c][1], phases[c][2])
    nScale.push(scale)
    nRnd.push(Math.random())
    nDrift.push(1)
  }
  for (let c = 0; c < clusters; c++) {
    const ctr = centers[c]
    addNode(ctr[0] * radius, ctr[1] * radius, ctr[2] * radius, c, 1.7) // bright hub
    for (let k = 0; k < nodesPerCluster; k++) {
      const s = 0.26
      let x = ctr[0] + g3() * s, y = ctr[1] + g3() * s, z = ctr[2] + g3() * s
      const L = Math.hypot(x, y, z) || 1
      const rr = radius * (0.97 + Math.random() * 0.06)
      addNode((x / L) * rr, (y / L) * rr, (z / L) * rr, c, 0.7 + Math.random() * 0.6)
    }
  }

  // ---- links: each node to its 2 nearest neighbours within a radius ----
  const lPos = [], lPhase = [], lRnd = [], lDrift = []
  const maxD = radius * 0.4
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]
    const near = []
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue
      const b = nodes[j]
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
      if (d < maxD) near.push([d, j])
    }
    near.sort((p, q) => p[0] - q[0])
    for (let m = 0; m < Math.min(2, near.length); m++) {
      const j = near[m][1]
      if (j < i) continue // unique pair
      const b = nodes[j]
      const r = Math.random()
      lPos.push(a.x, a.y, a.z, b.x, b.y, b.z)
      lPhase.push(phases[a.c][0], phases[a.c][1], phases[a.c][2], phases[b.c][0], phases[b.c][1], phases[b.c][2])
      lRnd.push(r, r)
      lDrift.push(1, 1)
    }
  }

  // ---- rings: great circles at varied tilts (structural, no drift) ----
  const rPos = [], rPhase = [], rRnd = [], rDrift = []
  const segs = 150
  for (let r = 0; r < rings; r++) {
    const tiltX = (r / rings) * Math.PI
    const tiltY = r * 0.7
    const rad = radius * 0.99
    for (let s = 0; s < segs; s++) {
      const p0 = ringPoint((s / segs) * TAU, rad, tiltX, tiltY)
      const p1 = ringPoint(((s + 1) / segs) * TAU, rad, tiltX, tiltY)
      const rnd = Math.random()
      rPos.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2])
      rPhase.push(0, 0, 0, 0, 0, 0)
      rRnd.push(rnd, rnd)
      rDrift.push(0, 0)
    }
  }

  const f32 = (a) => new Float32Array(a)
  return {
    nodes: { position: f32(nPos), aPhase: f32(nPhase), aScale: f32(nScale), aRnd: f32(nRnd), aDrift: f32(nDrift) },
    links: { position: f32(lPos), aPhase: f32(lPhase), aRnd: f32(lRnd), aDrift: f32(lDrift) },
    rings: { position: f32(rPos), aPhase: f32(rPhase), aRnd: f32(rRnd), aDrift: f32(rDrift) },
  }
}

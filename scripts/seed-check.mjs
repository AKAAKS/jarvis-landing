/* Builds the orb geometry three times in one process and compares fingerprints.
 *
 * Guards src/orb/rng.js: the orb must be the same object on every load, because
 * public/og.png is a photograph of it. Comparing rendered frames does NOT test
 * this — the orb animates, so two captures differ by timing even when the
 * geometry is identical. Hash the buffers instead.
 *
 *   node scripts/seed-check.mjs
 */
import { createHash } from 'node:crypto'
import { buildGlobe } from '../src/orb/globe.js'
import { buildCore } from '../src/orb/core.js'

const h = (b) => createHash('sha256')
  .update(Buffer.from(b.buffer, b.byteOffset, b.byteLength)).digest('hex').slice(0, 16)

const fingerprint = () => {
  const g = buildGlobe({ radius: 2, clusters: 24, nodesPerCluster: 55, rings: 7 })
  const c = buildCore(2800)
  return [h(g.nodes.position), h(g.links.position), h(g.rings.position),
          h(c.shapes[3]), h(c.aRnd)].join(' ')
}

const runs = [fingerprint(), fingerprint(), fingerprint()]
runs.forEach((r, i) => console.log(`build ${i + 1}: ${r}`))
const ok = runs.every((r) => r === runs[0])
console.log(ok ? 'DETERMINISTIC' : 'NOT DETERMINISTIC — the orb will reshuffle between loads')
process.exit(ok ? 0 : 1)

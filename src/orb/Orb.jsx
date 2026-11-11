import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { buildGlobe } from './globe'
import { buildCore } from './core'
import { nodeVertex, nodeFragment, lineVertex, lineFragment, coreVertex, coreFragment } from './shaders'
import { usePrefersReducedMotion, useIsMobile } from './hooks'

const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Per-beat orb placement and size.
//
// The orb is the running process the log describes, so it stands BESIDE the
// reading column, at a size that lets it be seen whole. An earlier pass pushed
// it up and out of frame to stop it wrecking legibility, which fixed the text
// by deleting the subject. Scaling it down and placing it properly keeps both.
//
// X IS A FRACTION OF THE VISIBLE HALF-WIDTH, NOT A WORLD UNIT. The camera is
// fov 45 at z=6, so the visible height is fixed at 2 * tan(22.5deg) * 6 = 4.98
// world units but the visible WIDTH scales with the viewport's aspect ratio —
// about 11 units wide at 16:9 and only 8 at 4:3. A fixed world offset that sits
// neatly beside the column on a wide monitor therefore slides off the right
// edge entirely on a narrow one. r3f hands us the measured viewport each frame,
// so the placement is taken from that instead of from an assumed aspect.
//
//   0.52 -> centre at 76% across: the orb sits whole in the free half, clear
//           of the 600px column, on any aspect
//   1.05 -> centre just past the right edge, so only the limb crosses it; this
//           is what the wide beats need, their column spanning the page
// THE PATH: one traverse down the page, with a single reversal.
//
// The old path went right, right, off-right, off-right, LEFT, off-RIGHT, right
// — three full-width reversals, two of them sweeping the orb straight across
// the middle of the screen behind whatever you were reading. That is what read
// as erratic. It now enters on the right, exits right, crosses once at the
// gate, and finishes on the left.
//
// The one crossing is placed at `guard` on purpose: the gate is the point in
// the story where the daemon changes its mind about a request, so it is the
// one place the orb changing sides means something.
//
// This is why `open` is right-aligned rather than left. Bookending the page
// with the orb back on the right would be tidier, but the return trip from
// off-left to right would drag it across the full width behind the closing
// content. The bookend is given up deliberately.
//
// X IS A FRACTION OF THE VISIBLE HALF-WIDTH, NOT A WORLD UNIT. The camera is
// fov 45 at z=6, so the visible height is fixed at 2 * tan(22.5deg) * 6 = 4.98
// world units but the visible WIDTH scales with the viewport's aspect — about
// 11 units wide at 16:9 and only 8 at 4:3. A fixed world offset that sits
// neatly beside the column on a wide monitor therefore slides off the right
// edge entirely on a narrow one. r3f hands us the measured viewport each
// frame, so the placement is taken from that instead of an assumed aspect.
//
//   |x| ~ 0.52 -> centre at 76% across: the orb sits whole in the free half,
//                 clear of the 600px column, at any aspect
//   |x| ~ 1.02 -> centre just past the edge, so only the limb crosses it;
//                 what the wide beats need, their column spanning the page
//
// Y drifts gently downward across the page so the traverse reads as a descent
// rather than a slide along a rail.
// X IS WHERE THE ORB'S INNER EDGE SITS, as a signed fraction of the visible
// half-width — NOT where its centre sits.
//
// That distinction is the whole trick. The camera's visible HEIGHT is fixed at
// +/-2.49 world units, but its visible WIDTH scales with the viewport's aspect
// (about 11 units wide at 16:9, only 8 at 4:3). The globe's radius, though, is
// a fixed world value. So positioning by centre-as-a-fraction still lets the
// orb eat further into the column as the window narrows: at 1440x860 it was
// crossing the whole right-hand column of the integration register.
//
// Anchoring the EDGE makes the gap hold at any aspect, because the radius is
// added after the fraction is resolved against the measured viewport:
//
//   x = sign * (|edge| * halfWidth + radius)
//
//   |edge| 0.18 -> the orb's inner edge sits at 59% across, clear of the
//                  600px reading column, which ends at ~51%
//   |edge| 0.90 -> inner edge at 95% across: only the outer sliver is touched,
//                  which is what the full-width beats need. 0.84 was not
//                  enough — the glow spills past the geometry, and the limb
//                  was just reaching the honest-state beat's left column.
//
// THE PATH: one traverse down the page, with a single reversal. The old path
// reversed three times, twice sweeping the orb across the middle of the screen
// behind whatever you were reading. It now enters right, exits right, crosses
// once, and finishes left, with y drifting down so it reads as a descent.
//
// The crossing is at `guard` on purpose: the gate is where the daemon changes
// its mind about a request, so it is the one place the orb changing sides
// means something. It is also why `open` is right-aligned — bookending with
// the orb back on the right would drag it across the full width behind the
// closing content.
const GLOBE_R = 2 // buildGlobe's default radius, before SCALES is applied

const OFFSETS = [
  [0.18, 0.18],   // 0 hero   — column left, orb whole on the right, high
  [0.18, -0.05],  // 1 listen — same side, settling: one object carried down
  [0.90, -0.28],  // 2 act    — wide column, so only the limb stays in frame
  [0.90, -0.10],  // 3 reach  — stays out right
  [-0.18, 0.02],  // 4 guard  — THE reversal. Column right, orb whole on left
  [-0.90, -0.22], // 5 state  — continues left, limb only
  [-0.18, 0.08],  // 6 open   — returns from the left, no sweep back across
]

const SCALES = [0.60, 0.60, 0.80, 0.80, 0.60, 0.80, 0.60]

// Resolve one beat's placement to a world x. Done per beat and then
// interpolated between the two RESULTS, never by interpolating `edge` itself:
// edge passes through zero at the crossing, and sign(0) would snap the orb by
// a whole radius.
function edgeToX(edge, scale, halfW) {
  const sign = edge < 0 ? -1 : 1
  return sign * (Math.abs(edge) * halfW + GLOBE_R * scale)
}

// Mobile: the column is full-width, so there is no free half to stand in and
// any horizontal offset slides the orb under the text. Park it above the
// content and let it crop against the top of the frame.
// Sized and placed so the WHOLE orb is on screen, in a band of its own above
// the headline. It used to sit at y 3.0 at scale 0.78 — radius 1.56, so only
// its bottom unit cleared the top of the frame and it read as a severed half
// stuck under the nav. Being big was costing it being an object.
//
// The camera's VERTICAL extent is fixed at +/-2.49 world units regardless of
// viewport, so these convert to stable percentages of screen height:
//   centre y 1.25 -> 24.9% down from the top
//   radius 2*0.41 -> 16.5% of viewport height
// i.e. the orb occupies 8.4%-41.3% of the screen, clear of the 56px nav, with
// the hero's own padding-top (styles.css) holding the text below it.
const MOBILE_OFFSET = [0, 1.25]
const MOBILE_SCALE = 0.41

// On a phone the orb cannot stand beside anything — the column is the whole
// screen — so it steps back as you start reading instead of competing. It stays
// a present object rather than being deleted, which is what pushing it off
// frame amounted to. Desktop never dims: there the orb has its own half.
//
// Keyed to scroll DISTANCE, not to the beat index. The mobile hero is taller
// than the viewport, so the reader scrolls through the orb's band while still
// on beat 0 — a per-beat gate leaves the limb sitting over the lead paragraph
// for the whole first screenful.
const MOBILE_DIM = 0.14
const MOBILE_FADE_OVER = 0.35 // fraction of a viewport height to fade across


function attr(geo, data, name, size) {
  geo.setAttribute(name, new THREE.BufferAttribute(data, size))
}

function Globe({ progressRef, beatRef, reduce, isMobile }) {
  const group = useRef()
  const spinY = useRef(0)
  const seg = useRef(-1) // current morph segment, so we only re-upload on change
  const target = useRef(new THREE.Vector3())
  const scaleNow = useRef(0.62)
  const opacityNow = useRef(1)

  const built = useMemo(() => {
    const data = buildGlobe({
      radius: 2,
      clusters: 24,
      nodesPerCluster: isMobile ? 34 : 55,
      rings: isMobile ? 6 : 7,
    })
    const px = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75)

    // ---- outer structured globe ----
    const nodeGeo = new THREE.BufferGeometry()
    attr(nodeGeo, data.nodes.position, 'position', 3)
    attr(nodeGeo, data.nodes.aPhase, 'aPhase', 3)
    attr(nodeGeo, data.nodes.aScale, 'aScale', 1)
    attr(nodeGeo, data.nodes.aRnd, 'aRnd', 1)
    attr(nodeGeo, data.nodes.aDrift, 'aDrift', 1)
    const nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uScale: { value: 1 }, uAmp: { value: 0.09 },
        uSize: { value: isMobile ? 2.7 : 3.2 }, uPixelRatio: { value: px },
      },
      vertexShader: nodeVertex, fragmentShader: nodeFragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    })
    nodeMat.toneMapped = false

    const linkGeo = new THREE.BufferGeometry()
    attr(linkGeo, data.links.position, 'position', 3)
    attr(linkGeo, data.links.aPhase, 'aPhase', 3)
    attr(linkGeo, data.links.aRnd, 'aRnd', 1)
    attr(linkGeo, data.links.aDrift, 'aDrift', 1)
    const linkMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uScale: { value: 1 }, uAmp: { value: 0.09 },
        uColor: { value: new THREE.Color('#ff8a2a') }, uOpacity: { value: 0.18 },
      },
      vertexShader: lineVertex, fragmentShader: lineFragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    })
    linkMat.toneMapped = false

    const ringGeo = new THREE.BufferGeometry()
    attr(ringGeo, data.rings.position, 'position', 3)
    attr(ringGeo, data.rings.aPhase, 'aPhase', 3)
    attr(ringGeo, data.rings.aRnd, 'aRnd', 1)
    attr(ringGeo, data.rings.aDrift, 'aDrift', 1)
    const ringMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uScale: { value: 1 }, uAmp: { value: 0.09 },
        uColor: { value: new THREE.Color('#ffb24d') }, uOpacity: { value: 0.3 },
      },
      vertexShader: lineVertex, fragmentShader: lineFragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    })
    ringMat.toneMapped = false

    // ---- central morphing mind-core ----
    const core = buildCore(isMobile ? 1800 : 2800)
    const coreGeo = new THREE.BufferGeometry()
    // LOAD-BEARING, despite the shader never reading it. three.js derives the
    // draw count from geometry.attributes.position, and renderBufferDirect
    // early-returns when it is undefined — delete this and the core silently
    // stops rendering while the outer globe keeps working. (Tried it. The orb
    // looked fine on the wide beats, where the core is off-frame anyway, and
    // only the guard beat gave it away.)
    attr(coreGeo, core.shapes[0].slice(), 'position', 3)
    attr(coreGeo, core.shapes[0].slice(), 'aFrom', 3)
    attr(coreGeo, core.shapes[1].slice(), 'aTo', 3)
    attr(coreGeo, core.aRnd, 'aRnd', 1)
    attr(coreGeo, core.aScale, 'aScale', 1)
    const coreColors = core.colors.map((c) => new THREE.Color(c))
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uProgress: { value: 0 }, uScale: { value: 1 },
        uSize: { value: isMobile ? 2.8 : 3.4 }, uPixelRatio: { value: px },
        uCoreColor: { value: coreColors[0].clone() },
      },
      vertexShader: coreVertex, fragmentShader: coreFragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    })
    coreMat.toneMapped = false

    return {
      nodeGeo, nodeMat, linkGeo, linkMat, ringGeo, ringMat,
      coreGeo, coreMat, coreShapes: core.shapes, coreColors,
      nShapes: core.shapes.length,
    }
  }, [isMobile])

  const { nodeMat, linkMat, ringMat, coreGeo, coreMat, coreShapes, coreColors, nShapes } = built
  const tmpColor = useRef(new THREE.Color())

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    const p = reduce ? 0 : clamp01(progressRef.current)

    // --- section math: which pair of core shapes + local progress within it ---
    const segs = nShapes - 1
    const f = p * segs
    let i = Math.min(segs - 1, Math.floor(f))
    if (i < 0) i = 0
    const local = f - i

    // swap the core morph buffers only when we cross into a new segment
    if (i !== seg.current) {
      seg.current = i
      coreGeo.attributes.aFrom.array.set(coreShapes[i])
      coreGeo.attributes.aTo.array.set(coreShapes[i + 1])
      coreGeo.attributes.aFrom.needsUpdate = true
      coreGeo.attributes.aTo.needsUpdate = true
    }
    coreMat.uniforms.uProgress.value = local

    // per-section accent colour (lerp across the segment)
    tmpColor.current.copy(coreColors[i]).lerp(coreColors[i + 1], THREE.MathUtils.smoothstep(local, 0, 1))
    coreMat.uniforms.uCoreColor.value.copy(tmpColor.current)

    // --- rotation: slow auto-spin + a scrubbed turn driven by scroll ---
    if (!reduce) spinY.current += delta * 0.05
    g.rotation.y = spinY.current + p * 2.4
    g.rotation.x = Math.sin(t * 0.1) * 0.05 + p * 0.3

    // --- stand the orb beside the beat's content, never behind it ---
    // This used to be `const k = isMobile ? 0 : 1`, which pinned the orb dead
    // centre on mobile — i.e. directly behind every heading and paragraph on
    // the narrowest screens, the worst case rather than the safe one.
    // beatRef carries a fractional beat position, so the target is interpolated
    // between two placements rather than jumping to one. See useActiveBeat.
    const bp = beatRef ? Math.max(0, Math.min(OFFSETS.length - 1, beatRef.current)) : 0
    const i0 = Math.floor(bp)
    const i1 = Math.min(OFFSETS.length - 1, i0 + 1)
    const bf = bp - i0 // 'f' is already the morph segment's fraction

    // state.viewport is the visible extent at z=0 in world units, measured from
    // the real canvas rather than assumed from an aspect ratio.
    const halfW = state.viewport.width / 2
    if (isMobile) {
      target.current.set(MOBILE_OFFSET[0], MOBILE_OFFSET[1], 0)
    } else {
      const x0 = edgeToX(OFFSETS[i0][0], SCALES[i0], halfW)
      const x1 = edgeToX(OFFSETS[i1][0], SCALES[i1], halfW)
      const oy = OFFSETS[i0][1] + (OFFSETS[i1][1] - OFFSETS[i0][1]) * bf
      target.current.set(x0 + (x1 - x0) * bf, oy, 0)
    }
    // A light smoothing pass on top of an already-continuous target: it only
    // takes the edge off frame-to-frame scroll sampling, it is not what moves
    // the orb between beats any more.
    g.position.lerp(target.current, Math.min(1, delta * 6))

    // Scale eases toward the beat's size at the same rate the position does, so
    // the orb reads as one object moving and receding rather than two effects.
    const wantScale = isMobile ? MOBILE_SCALE : SCALES[i0] + (SCALES[i1] - SCALES[i0]) * bf
    scaleNow.current += (wantScale - scaleNow.current) * Math.min(1, delta * 6)
    g.scale.setScalar(scaleNow.current)

    // Written straight to the canvas element rather than through React state:
    // this runs every frame and a setState here would re-render the whole
    // scene graph 60 times a second. Guarded so the DOM write only happens
    // when the value actually changes.
    let wantOpacity = 1
    if (isMobile) {
      const t = clamp01(window.scrollY / (window.innerHeight * MOBILE_FADE_OVER))
      wantOpacity = 1 - (1 - MOBILE_DIM) * t
    }
    if (Math.abs(wantOpacity - opacityNow.current) > 0.01) {
      opacityNow.current = wantOpacity
      state.gl.domElement.style.opacity = wantOpacity.toFixed(3)
    }

    // --- outer globe reacts more between sections ---
    // clusters surge mid-transition then re-settle ("sections moving here and there")
    const surge = Math.sin(local * Math.PI)
    const amp = reduce ? 0 : 0.08 * (1 + surge * 1.6)
    const outerScale = 1 + Math.sin(p * Math.PI) * 0.1
    const ringScale = 1 + Math.sin(p * Math.PI) * 0.18
    const tt = reduce ? 0 : t

    nodeMat.uniforms.uTime.value = tt
    nodeMat.uniforms.uScale.value = outerScale
    nodeMat.uniforms.uAmp.value = amp
    linkMat.uniforms.uTime.value = tt
    linkMat.uniforms.uScale.value = outerScale
    linkMat.uniforms.uAmp.value = amp
    linkMat.uniforms.uOpacity.value = 0.1 + 0.34 * Math.sin(p * Math.PI)
    ringMat.uniforms.uTime.value = tt
    ringMat.uniforms.uScale.value = ringScale

    coreMat.uniforms.uTime.value = tt
    coreMat.uniforms.uScale.value = 1 + surge * 0.12
  })

  return (
    <group ref={group}>
      <lineSegments geometry={built.ringGeo} material={ringMat} frustumCulled={false} />
      <lineSegments geometry={built.linkGeo} material={linkMat} frustumCulled={false} />
      <points geometry={built.nodeGeo} material={nodeMat} frustumCulled={false} />
      <points geometry={coreGeo} material={coreMat} frustumCulled={false} />
    </group>
  )
}

export default function Orb({ progressRef, beatRef }) {
  const reduce = usePrefersReducedMotion()
  const isMobile = useIsMobile()
  return (
    <Canvas
      className="orb-canvas"
      dpr={[1, isMobile ? 1.5 : 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 45, position: [0, 0, 6] }}
    >
      <Globe progressRef={progressRef} beatRef={beatRef} reduce={reduce} isMobile={isMobile} />
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.5} luminanceSmoothing={0.25} radius={0.5} />
      </EffectComposer>
      {!reduce && <AdaptiveDpr pixelated={false} />}
    </Canvas>
  )
}

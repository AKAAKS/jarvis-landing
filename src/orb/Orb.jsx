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

// Per-beat screen offset (world units): push the orb to the open side so the
// morphing core peeks beside each panel. hero/open centred; side beats opposite
// their panel; wide beats drift up-and-out so a crescent of the core shows.
// Horizontal axis only — centre / left / right per section, no vertical drift.
const OFFSETS = [
  [0, 0],     // 0 hero   — centre
  [2.6, 0],   // 1 listen — text left, orb right
  [4.4, 0],   // 2 act    — wide: dock right
  [4.6, 0],   // 3 reach  — wide: dock right
  [-2.6, 0],  // 4 guard  — text right, orb left
  [4.4, 0],   // 5 state  — wide: dock right
  [0, 0],     // 6 open   — centre
]

function attr(geo, data, name, size) {
  geo.setAttribute(name, new THREE.BufferAttribute(data, size))
}

function Globe({ progressRef, beatRef, reduce, isMobile }) {
  const group = useRef()
  const spinY = useRef(0)
  const seg = useRef(-1) // current morph segment, so we only re-upload on change
  const target = useRef(new THREE.Vector3())

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
    attr(coreGeo, core.shapes[0].slice(), 'position', 3) // placeholder, unused in shader
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

    // --- move the orb to the open side of each beat so the core stays visible ---
    const bi = beatRef ? Math.max(0, Math.min(OFFSETS.length - 1, beatRef.current)) : 0
    const k = isMobile ? 0 : 1 // on mobile the panels are full-width; keep it centred
    target.current.set(OFFSETS[bi][0] * k, OFFSETS[bi][1] * k, 0)
    g.position.lerp(target.current, Math.min(1, delta * 3))

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

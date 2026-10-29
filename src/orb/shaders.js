/* Shaders for the structured globe.
 * Drift is computed from a per-vertex cluster PHASE (aPhase): every particle in
 * a cluster shares the same phase, so the cluster moves as one section. aDrift
 * gates it (0 for the structural rings). Additive, emissive (toneMapped:false)
 * so bloom catches the bright nodes. */

const DRIFT = /* glsl */ `
vec3 clusterDrift(float t, vec3 phase, float gate){
  return gate * uAmp * vec3(
    sin(t * 0.50 + phase.x),
    sin(t * 0.43 + phase.y),
    sin(t * 0.61 + phase.z)
  );
}
`

export const nodeVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uScale;
uniform float uAmp;
attribute vec3 aPhase;
attribute float aScale;
attribute float aRnd;
attribute float aDrift;
varying float vRnd;
varying float vBright;
varying float vMix;
${DRIFT}
void main(){
  vec3 base = position;
  vec3 pos = (base + clusterDrift(uTime, aPhase, aDrift)) * uScale;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec3 nrm = normalize(normalMatrix * normalize(base));
  vec3 vdir = normalize(-mv.xyz);
  float rim = pow(1.0 - abs(dot(nrm, vdir)), 2.0);
  vBright = 0.55 + rim * 0.9;
  vMix = clamp(length(pos) / 2.3, 0.0, 1.0);
  vRnd = aRnd;

  gl_PointSize = uSize * aScale * uPixelRatio * (9.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

export const nodeFragment = /* glsl */ `
precision highp float;
uniform float uTime;
varying float vRnd;
varying float vBright;
varying float vMix;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0);

  vec3 core = vec3(1.00, 0.95, 0.70);
  vec3 mid  = vec3(1.00, 0.68, 0.20);
  vec3 edge = vec3(1.00, 0.42, 0.15);
  vec3 col = mix(core, mid, smoothstep(0.0, 0.5, vMix));
  col = mix(col, edge, smoothstep(0.5, 1.0, vMix));

  float tw = 0.85 + 0.15 * sin(uTime * 2.0 + vRnd * 30.0);
  float intensity = (0.50 + vRnd * 0.40) * tw * vBright;

  gl_FragColor = vec4(col * intensity, a);
}
`

export const lineVertex = /* glsl */ `
uniform float uTime;
uniform float uScale;
uniform float uAmp;
attribute vec3 aPhase;
attribute float aRnd;
attribute float aDrift;
varying float vRnd;
${DRIFT}
void main(){
  vec3 pos = (position + clusterDrift(uTime, aPhase, aDrift)) * uScale;
  vRnd = aRnd;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const lineFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vRnd;
void main(){
  gl_FragColor = vec4(uColor * (0.6 + vRnd * 0.5), uOpacity);
}
`

/* Central mind-core: blends between two shape buffers (aFrom -> aTo) by
 * uProgress, swirls gently, and takes a per-section accent colour. */
export const coreVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uProgress;
uniform float uScale;
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aRnd;
attribute float aScale;
varying float vRnd;
varying float vMix;
void main(){
  float pr = smoothstep(0.0, 1.0, uProgress);
  vec3 pos = mix(aFrom, aTo, pr);

  float ang = uTime * 0.18;
  float c = cos(ang), s = sin(ang);
  pos.xz = mat2(c, -s, s, c) * pos.xz;
  pos *= uScale;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vRnd = aRnd;
  vMix = clamp(length(pos) / 1.1, 0.0, 1.0);
  gl_PointSize = uSize * aScale * uPixelRatio * (9.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

export const coreFragment = /* glsl */ `
precision highp float;
uniform vec3 uCoreColor;
uniform float uTime;
varying float vRnd;
varying float vMix;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0);

  float tw = 0.82 + 0.18 * sin(uTime * 2.2 + vRnd * 22.0);
  vec3 col = mix(vec3(1.0), uCoreColor, 0.22 + vMix * 0.78); // white-hot centre
  float intensity = (0.70 + vRnd * 0.40) * tw;

  gl_FragColor = vec4(col * intensity, a);
}
`

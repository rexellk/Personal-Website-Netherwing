// Netherwing intro cinematic — shared by the site (src/components/IntroCinematic.jsx) and the
// review prototype (intro-prototype/). Every visual is a pure function of timeline time `t`
// (0–DURATION) so any frame can be scrubbed and reviewed. Shot list: see SHOTS below.
//
//   const intro = await mountIntro(container, { assetBase, params, dracoPath, shouldRender })
//   intro.play(); intro.onDone(cb); intro.setT(x); intro.dispose()
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const DURATION = 5.6;                 // timeline length (all keys are authored in this time)
// Playback is slower than the authored timeline from phase 2 on (owner asked for slower; it was too
// fast to read). Wall-clock seconds → timeline seconds:
export const SLOW_FROM = 0.9, SLOW = 1.4;
export const PLAY_DURATION = SLOW_FROM + (DURATION - SLOW_FROM) * SLOW;   // real seconds (SLOW 1.4 → ≈ 7.5s)
export const toTimeline = (real) => (real <= SLOW_FROM ? real : SLOW_FROM + (real - SLOW_FROM) / SLOW);
export const toReal = (tl) => (tl <= SLOW_FROM ? tl : SLOW_FROM + (tl - SLOW_FROM) * SLOW);

export const SHOTS = [
  [0.0, "1 · Anticipation — push in on the crack"],
  [0.9, "2 · Breach — only the claw tears through; dragon faces us behind the fabric"],
  [1.9, "3 · Emergence — square-on, slides out along the tear"],
  [2.95, "4 · Roar — locked low 3/4 on the head"],
  [4.25, "5 · Bolt — it launches past us; camera holds, then pans home"],
  [5.4, "6 · Home — back on the opening shot, the rift flat on screen"],
];

// ─── math ────────────────────────────────────────────────────────────────────
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a, b, u) => a + (b - a) * u;
const eIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eOut = (u) => 1 - Math.pow(1 - u, 3);
const eIn = (u) => u * u * u;
const bell = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));
const impulse = (t, t0, decay) => (t >= t0 ? Math.exp(-(t - t0) * decay) : 0);

// Keyframe track: [{t, v:[...], e}] — `e` eases the segment arriving at that key
function track(keys, t) {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const u = (b.e || eIO)(seg(t, a.t, b.t));
      return a.v.map((x, k) => lerp(x, b.v[k], u));
    }
  }
  return keys[keys.length - 1].v;
}

// Smooth track: cubic Hermite through the keys with time-scaled tangents, so velocity
// is continuous across keys (no stop at every key). Ends ease in/out.
function smoothTrack(keys, t) {
  if (t <= keys[0].t) return keys[0].v;
  const n = keys.length;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0; while (t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], h = b.t - a.t, u = (t - a.t) / h;
  const tan = (k) => (k === 0 || k === n - 1) ? null : keys[k];
  const slope = (k, c) => { const p = keys[k - 1], q = keys[k + 1]; return (q.v[c] - p.v[c]) / (q.t - p.t); };
  const h00 = 2*u*u*u - 3*u*u + 1, h10 = u*u*u - 2*u*u + u, h01 = -2*u*u*u + 3*u*u, h11 = u*u*u - u*u;
  return a.v.map((x, c) => {
    const ma = tan(i) ? slope(i, c) * h : 0, mb = tan(i + 1) ? slope(i + 1, c) * h : 0;
    return h00 * x + h10 * ma + h01 * b.v[c] + h11 * mb;
  });
}

export async function mountIntro(container, opts = {}) {
const params = new URLSearchParams(opts.params || "");          // debug knobs (prototype only)
const assetBase = opts.assetBase ?? "./";

// ─── renderer / scene ────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, opts.maxPixelRatio || 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.style.display = "block";
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 300);
scene.add(camera);

// ─── the void behind the rift: star sphere + nebula ─────────────────────────
{
  const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 60 + Math.random() * 40;
    const s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    const purple = Math.random() > 0.6, k = 1.2 + Math.random() * 1.6;
    col.set([(purple ? 0.8 : 1) * k, (purple ? 0.35 : 1) * k, k], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, depthWrite: false })));
}
function canvasTex(size, draw) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}
const glowTex = canvasTex(256, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
});
const nebula = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.18, 0.16, 0.70), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
nebula.position.set(0, 0, -30); nebula.scale.set(55, 40, 1); scene.add(nebula);
// Vortex inside the rift (owner's reference): magenta/violet spiral arms, slowly turning
const swirlTex = canvasTex(1024, (g, s) => {
  const img = g.createImageData(s, s), d = img.data;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (x - s / 2) / (s / 2), dy = (y - s / 2) / (s / 2), r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const arm = Math.pow(0.5 + 0.5 * Math.cos(3 * a + 7 * Math.log(r + 0.05)), 3);   // 3 log-spiral arms
    const fall = Math.max(0, 1 - r) ** 1.5, core = Math.exp(-r * 6);
    const k = (arm * 0.8 + 0.15) * fall + core * 0.6, i = (y * s + x) * 4;
    d[i] = 255 * Math.min(1, k * (0.85 + 0.15 * arm)); d[i + 1] = 255 * Math.min(1, k * 0.32); d[i + 2] = 255 * Math.min(1, k * (0.7 + 0.3 * (1 - arm))); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
});
const swirl = new THREE.Sprite(new THREE.SpriteMaterial({ map: swirlTex, color: new THREE.Color(0.75, 0.4, 1.0), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
swirl.position.set(0, 0.2, -6); swirl.scale.set(9, 9, 1); scene.add(swirl);

// God-rays: a radial streak burst behind the tear. The rift fabric occludes it,
// so the rays only exist *through the tear* — backlight, not a global glow.
const raysTex = canvasTex(1024, (g, s) => {
  g.translate(s / 2, s / 2); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, w = 0.01 + Math.random() * 0.035, len = s * (0.3 + Math.random() * 0.2);
    const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    gr.addColorStop(0, `rgba(230,190,255,${0.12 + Math.random() * 0.18})`); gr.addColorStop(0.5, "rgba(200,140,255,0.05)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0);
    g.arc(0, 0, len, a - w, a + w); g.closePath(); g.fill();
  }
});
const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTex, color: new THREE.Color(0.55, 0.45, 1.0), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
rays.position.set(0, 0, -4.5); rays.scale.set(24, 24, 1);   // well behind the wings, so they never wash over the dragon scene.add(rays);
const tearCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.9, 0.35, 1.3), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
tearCore.position.set(0, 0, -4.5); tearCore.scale.set(5, 10, 1); scene.add(tearCore);

// ─── the rift, now a surface in the 3D scene ────────────────────────────────
// Ported from RiftCanvas. The tear `discard`s, so the dragon behind shows
// through it and the fabric (which writes depth) hides it everywhere else.
const RIFT_SIZE = 120;   // big enough that no camera angle sees its edge
const TEAR_SPACE = 30;   // tear pattern is authored in 30-unit space
// Shared tear geometry (GLSL) — the rift fabric AND the dragon's "veil" clip both
// use it, so the dragon can only exist in front of the plane inside the tear.
const TEAR_GLSL = /* glsl */`
  float t_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float t_noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(t_hash(i),t_hash(i+vec2(1,0)),f.x), mix(t_hash(i+vec2(0,1)),t_hash(i+vec2(1,1)),f.x), f.y); }
  float t_fbm(vec2 p){ float v=0.0,a=0.5; mat2 m=mat2(0.8,-0.6,0.6,0.8); for(int i=0;i<5;i++){ v+=a*t_noise(p); p=m*p*2.1; a*=0.5; } return v; }
  vec2 t_rot(vec2 uv,float a){ vec2 c=uv-0.5; return vec2(cos(a)*c.x-sin(a)*c.y, sin(a)*c.x+cos(a)*c.y)+0.5; }
  // Grip: while the claws force the tear, its edges pass exactly through the two claw
  // points (half-width uGripW at height uGripY) and it bows into a lens between them.
  float t_gripMask(float y, float len){ return uGripK * (1.0 - smoothstep(0.0, len, abs(y - uGripY))); }
  // spine: jagged, non-periodic torn edge (straightened where the claws hold it)
  float t_spine(float y, float time){
    float s = 0.5 + (t_fbm(vec2(y*38.0, time*0.12)) - 0.5) * 0.014 + (t_noise(vec2(y*170.0, 7.0)) - 0.5) * 0.004;
    return mix(s, 0.5 + uGripC, t_gripMask(y, uLen));
  }
  // half-width: lens-shaped (tapers to points at both ends), uneven along its length
  float t_half(float y, float halfOpen, float len){
    float along = abs(y - 0.5);
    float taper = 1.0 - smoothstep(len * 0.25, len, along);
    float hw = halfOpen * taper * (0.7 + 0.6 * t_fbm(vec2(y*55.0, 3.0)));
    // crystalline lip: straight-edged facets (piecewise-linear teeth of random size), not a smooth burn
    float fy = y * 260.0, fi = floor(fy), ff = fract(fy);
    float tooth = mix(t_hash(vec2(fi, 2.0)), t_hash(vec2(fi + 1.0, 2.0)), ff);
    hw *= 0.86 + 0.28 * tooth;
    float d = abs(y - uGripY) / max(len, 1e-4);
    float jag = 1.0 + 0.3 * (t_fbm(vec2(y*70.0, 9.0)) - 0.5) * smoothstep(0.0, 0.25, d);   // exact at the claws, ragged away from them
    float grip = uGripW * max(0.0, 1.0 - d * d) * jag;
    return mix(hw, max(hw, grip), uGripK);
  }
`;
const riftUniforms = {
  uTime: { value: 0 }, uRiftP: { value: 0 }, uCrackP: { value: 0 }, uAngle: { value: 0.7 },
  uHalfOpen: { value: 0 }, uBurstGlow: { value: 0 }, uLen: { value: 0.03 },
  uGripY: { value: 0.5 }, uGripW: { value: 0 }, uGripK: { value: 0 }, uGripC: { value: 0 },
  uClaw0: { value: new THREE.Vector2(99, 99) }, uClaw1: { value: new THREE.Vector2(99, 99) }, uClawK: { value: 0 },
};
const rift = new THREE.Mesh(
  new THREE.PlaneGeometry(RIFT_SIZE, RIFT_SIZE),
  new THREE.ShaderMaterial({
    uniforms: riftUniforms,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform float uTime, uRiftP, uCrackP, uAngle, uHalfOpen, uBurstGlow, uLen, uGripY, uGripW, uGripK, uGripC, uClawK;
      uniform vec2 uClaw0, uClaw1;
      ${TEAR_GLSL}
      const vec3 FABRIC_RGB = vec3(0.045, 0.012, 0.07);   // violet-black: same as the portfolio hero background
      // Where a claw punches the fabric: it dents toward the claw, cracks radiate out and glow,
      // all strongest at the claw and dying off with distance (world units).
      vec2 clawDent(vec2 p, vec2 c){ vec2 d = p - c; float r = length(d) + 1e-4; return -d / r * 0.09 * exp(-r * 4.0) * uClawK; }
      vec3 clawFx(vec2 p, vec2 c){
        vec2 d = p - c; float r = length(d) + 1e-4;
        float glow = exp(-r * 9.0) * 0.16 + exp(-r * 2.4) * 0.1;
        float x = atan(d.y, d.x) * 1.4324;                                    // 9 cracks around the claw
        float id = floor(x + 0.5);
        float wob = (t_fbm(vec2(r * 6.0, id * 3.7)) - 0.5) * 0.9;             // jagged, not straight spokes
        float line = 1.0 - smoothstep(0.0, 0.009 / r * 1.4324, abs(fract(x + wob + 0.5) - 0.5));
        float reach = 0.18 + 0.55 * t_hash(vec2(id, 5.0));                    // each crack runs a different length
        float crack = line * (1.0 - smoothstep(reach * 0.6, reach, r)) * smoothstep(0.015, 0.05, r);
        float twig = (1.0 - smoothstep(0.0, 0.006 / r * 3.0, abs(fract(x * 2.1 + wob * 1.7) - 0.5)))
                   * (1.0 - smoothstep(0.08, 0.22, r)) * step(0.55, t_hash(vec2(floor(x * 2.1 + 0.5), 9.0)));
        return min(vec3(1.5), (vec3(0.9, 0.35, 0.95) * glow + vec3(1.0, 0.45, 0.85) * (crack + 0.6 * twig) * 1.6 * exp(-r * 2.2)) * uClawK);
      }
      void main(){
        vec2 ruv = t_rot((vUv - 0.5) * ${RIFT_SIZE / 30}.0 + 0.5, uAngle);
        float spine = t_spine(ruv.y, uTime);
        float dist = abs(ruv.x - spine);
        float hw = t_half(ruv.y, uHalfOpen, uLen);
        if (hw > 0.00005 && dist < hw) discard;
        vec2 pw = (vUv - 0.5) * ${RIFT_SIZE}.0;                                // world xy on the rift plane
        vec2 fuv = t_rot((pw + clawDent(pw, uClaw0) + clawDent(pw, uClaw1)) / ${TEAR_SPACE}.0 + 0.5, uAngle) * 7.5;
        float cloth = clamp(t_fbm(fuv*24.0 + vec2(uTime*0.06,uTime*0.04))*0.55 + t_fbm(vec2(fuv.y*1.1,fuv.x*0.9)*20.0 - uTime*0.05)*0.45, 0.0, 1.0);
        // smooth flat dark before the tear opens (owner: no fuzz); the cloth texture fades in as it rips
        vec3 col = mix(vec3(0.0), FABRIC_RGB, mix(0.25, cloth*0.6, uRiftP));
        float along = abs(ruv.y - 0.5);
        float inTear = 1.0 - smoothstep(uLen * 0.6, uLen * 1.05, along);
        float ed = max(dist - hw, 0.0) * 4.0;            // plane-UV → ~screen-UV scale
        if (uHalfOpen > 0.00005) {
          float shimmer = 0.75 + 0.25 * t_noise(vec2(ruv.y * 400.0, uTime * 6.0));
          float burst = 1.0 + uBurstGlow * 3.0;
          float drive = max(uRiftP, uBurstGlow * 0.8);    // rim is hot at the moment of impact
          // where the claws pinch the lip the rim is choked dark, so the claws read as silhouettes
          float pinch = 1.0 - 0.9 * uGripK * exp(-pow((ruv.y - uGripY) / max(uLen * 0.16, 1e-4), 2.0));
          float core = exp(-ed*260.0) * drive * shimmer * burst * inTear * pinch;
          float mid  = exp(-ed*70.0)  * drive * shimmer * burst * 0.6 * inTear * pinch;
          float halo = exp(-ed*16.0)  * drive * 0.28 * burst * inTear;
          // ragged burnt fibres along the lip
          float fibres = step(0.62, t_noise(vec2(ruv.y * 900.0, dist * 900.0))) * exp(-ed*120.0) * drive * inTear * pinch;
          // crystal bevel: a band of flat-shaded facets on the lip's inner face
          float bev = (1.0 - smoothstep(0.0, 0.03, ed)) * (0.35 + 0.65 * t_hash(floor(vec2(ruv.y * 420.0, ed * 90.0)))) * drive * inTear;
          col += mix(vec3(0.62,0.22,1.0), vec3(1.0,0.80,0.98), core) * core * 0.8           // electric violet → white-pink core
               + vec3(0.55,0.18,1.0) * mid * 1.1 + vec3(0.16,0.04,0.30) * halo
               + vec3(1.0,0.55,0.95) * fibres * 1.0 + vec3(0.40,0.20,0.85) * bev * 0.9;
        }
        if (uCrackP > 0.0 && uRiftP < 0.3) {       // hairline crack before the tear
          float crack = exp(-dist * 5600.0) * uCrackP * inTear;
          col += vec3(1.0,0.75,1.0) * crack * (3.0 + uBurstGlow * 12.0);
        }
        if (uClawK > 0.001) col += clawFx(pw, uClaw0) + clawFx(pw, uClaw1);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }),
);
scene.add(rift);

// Claw aura: a camera-facing quad per claw — soft glow core (no rings: owner)
const auraMat = new THREE.ShaderMaterial({
  uniforms: { uK: { value: 0 }, uTime: { value: 0 } },
  transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv; uniform float uK, uTime;
    void main(){
      float r = length(vUv - 0.5) * 2.0;                                      // 0 centre … 1 edge
      float core = exp(-r * 12.0) * 0.07 + exp(-r * 3.0) * 0.05;             // soft — the claw must stay readable
      gl_FragColor = vec4(vec3(1.0, 0.45, 0.9) * core, 1.0) * uK;
    }`,
});
const auras = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.65), auraMat); m.renderOrder = 12; scene.add(m); return m; });
// Pixel flecks: square motes, dense at the claw and thinning out, flickering as they drift away
const FLECK_N = 150;
const fleckSeeds = Array.from({ length: FLECK_N * 2 }, () => ({ a: Math.random() * Math.PI * 2, u: Math.random(), s: 0.5 + Math.random(), ph: Math.random() * 50, v: 0.15 + Math.random() * 0.35 }));
const fleckGeo = new THREE.BufferGeometry();
fleckGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FLECK_N * 2 * 3), 3));
fleckGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(FLECK_N * 2), 1));
fleckGeo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(FLECK_N * 2), 1));
const flecks = new THREE.Points(fleckGeo, new THREE.ShaderMaterial({
  transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uScale: { value: innerHeight / 2 } },
  vertexShader: /* glsl */`attribute float aSize, aAlpha; varying float vA; uniform float uScale;
    void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vA = aAlpha; gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: /* glsl */`varying float vA; void main(){ gl_FragColor = vec4(vec3(1.0, 0.55, 0.9) * vA, 1.0); }`,   // hard square = pixel
}));
flecks.frustumCulled = false; flecks.renderOrder = 13; scene.add(flecks);

// Particles pulled into the crack during anticipation
const SUCK_N = 120;
const suckSeeds = Array.from({ length: SUCK_N }, () => ({
  a: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 3.2, z: 0.2 + Math.random() * 1.8,
  y: (Math.random() - 0.5) * 5, ph: Math.random(),
}));
const suckGeo = new THREE.BufferGeometry();
suckGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SUCK_N * 6), 3));
const suck = new THREE.LineSegments(suckGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(1.3, 0.9, 1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(suck);

// Haze cards: faint atmospheric layers in front of the tear for depth
const haze = [[-1.8, 0.6, 0.6, 7, 0.9, 0.5, 1.2], [1.9, -0.8, 1.1, 8, 0.5, 0.8, 1.3], [0.4, 1.9, 1.6, 9, 0.8, 0.45, 1.1], [-0.6, -1.6, 2.3, 7, 0.45, 0.9, 1.2]].map(([x, y, z, sc, r, g, b]) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  sp.position.set(x, y, z); sp.scale.set(sc, sc * 0.6, 1); scene.add(sp); return sp;
});

// ─── lights: low-key, keyed from behind ─────────────────────────────────────
const hemi = new THREE.HemisphereLight(0x262a40, 0x050008, 0.30); scene.add(hemi);
const rimLight = new THREE.DirectionalLight(0xd27cff, 0); rimLight.position.set(3.5, 2, -4); scene.add(rimLight);
const rimLight2 = new THREE.DirectionalLight(0xd27cff, 0); rimLight2.position.set(-3.5, 2, -4); scene.add(rimLight2);
const pinkBack = new THREE.DirectionalLight(0xff6ad8, 0); pinkBack.position.set(-4, -1, -5); scene.add(pinkBack);
const fill = new THREE.DirectionalLight(0x8a96b8, 0.05); fill.position.set(2, 1, 6); scene.add(fill);
const tearLight = new THREE.PointLight(0x9a5cff, 0, 12, 1.0); tearLight.position.set(0, 0, -2.0); scene.add(tearLight);
// claw sparks light the forearms (one per hand, placed on the claw FX each frame)
const clawLights = [0, 1].map(() => { const l = new THREE.PointLight(0xffd0ff, 0, 0.9, 2.0); scene.add(l); return l; });
// Cool top-front key so the head and jaw read during the roar and launch
// top-side key, slightly behind: lights the head from above without flattening it (was a cyan on-camera "flash")
const headKey = new THREE.DirectionalLight(0xb8c4e0, 0); headKey.position.set(-3, 5, 1); scene.add(headKey);
// Take-off backlight from the void side: dark wings with hot rims, like the HSR/HotD refs
// Soft front key (owner: no shadowed dragon) — lights the face and body from above-front
const faceKey = new THREE.DirectionalLight(0xd8ccff, 0); faceKey.position.set(1.5, 3, 6); scene.add(faceKey);
const FACE_K = Number(params.get("faceKey") || 1.3);
const WING_SHADE = Number(params.get("wingShade") || 0.3);   // 0 = none … 1 = black
const backKey = new THREE.DirectionalLight(0xb070ff, 0); backKey.position.set(-2, 3, -5); scene.add(backKey);

// ─── butterflies: burst swarm + rushers past the lens ───────────────────────
const tl = new THREE.TextureLoader();
const bfTex = tl.load(`${assetBase}butterfly.png`); bfTex.colorSpace = THREE.SRGBColorSpace;
const bokehTex = tl.load(`${assetBase}butterfly-bokeh.png`); bokehTex.colorSpace = THREE.SRGBColorSpace;
const TINTS = [new THREE.Color(1.2, 0.6, 2.0), new THREE.Color(0.3, 1.6, 2.0), new THREE.Color(1.2, 0.6, 2.0), new THREE.Color(0.4, 1.8, 1.9), new THREE.Color(1.2, 0.6, 2.0)];

// Big bokeh butterflies that rush past the lens during the burst
const rushers = Array.from({ length: 5 }, (_, i) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bokehTex, color: TINTS[i % TINTS.length], transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  sp.renderOrder = 11; camera.add(sp);
  return { sp, x: (i % 2 ? 1 : -1) * (0.25 + Math.random() * 0.5), y: (Math.random() - 0.5) * 0.7, t0: 3.35 + i * 0.12, rot: Math.random() * 6 };
});
// Swarm bursting out of the tear, stretched along velocity (motion streaks)
const SWARM_N = 80;
const swarm = Array.from({ length: SWARM_N }, (_, i) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bfTex, color: TINTS[i % TINTS.length], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(sp);
  const a = Math.random() * Math.PI * 2;
  return {
    sp, t0: 3.28 + Math.random() * 0.35, o: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 2.4, -0.6),
    v: new THREE.Vector3(Math.cos(a) * (0.8 + Math.random() * 1.6), Math.sin(a) * (0.6 + Math.random() * 1.3) + 0.3, 2.0 + Math.random() * 3.5),
    s: 0.08 + Math.random() * 0.16, ph: Math.random() * 6,
  };
});


// ─── post chain: bloom → afterimage (wing-sweep smear) → grade → output ─────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.45, 0.3, 1.0);   // half-res: tighter + cheaper
composer.addPass(bloom);
const afterimage = new AfterimagePass(0); composer.addPass(afterimage);
const VIBE = Number(params.get("vibe") || 1.1);   // base saturation of the grade (was 0.85)
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null }, uDesat: { value: 0 }, uVignette: { value: 0.35 }, uCA: { value: 0.002 },
    uAspect: { value: innerWidth / innerHeight }, uTime: { value: 0 },
    uShockC: { value: new THREE.Vector2(0.5, 0.5) }, uShockR: { value: 0 }, uShockS: { value: 0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uDesat, uVignette, uCA, uAspect, uTime, uShockR, uShockS; uniform vec2 uShockC;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      if (uShockS > 0.0) {                       // expanding shockwave ring distorts the frame
        vec2 d = uv - uShockC; d.x *= uAspect;
        float dist = length(d);
        float ring = exp(-pow((dist - uShockR) * 30.0, 2.0));
        vec2 dir = normalize(d + 1e-5); dir.x /= uAspect;
        uv -= dir * ring * uShockS;
      }
      vec2 c = uv - 0.5;                          // radial chromatic aberration, stronger at edges
      float lumC = dot(texture2D(tDiffuse, uv).rgb, vec3(0.2126, 0.7152, 0.0722));
      vec2 off = c * uCA * (0.4 + dot(c,c) * 3.0) * (0.3 + 0.7 * smoothstep(0.45, 0.85, lumC));   // fringes on the energy, dragon stays clean
      vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      // (runs AFTER OutputPass: display-space values 0..1)
      float keep = smoothstep(0.75, 0.98, lum);     // desaturate the world, keep emissive accents saturated
      col = mix(col, vec3(lum) * vec3(0.92, 0.95, 1.08), uDesat * (1.0 - keep));
      // split-tone: indigo shadows, violet-magenta highlights
      col = mix(col * vec3(0.92, 0.96, 1.10), col * vec3(1.06, 0.94, 1.04), smoothstep(0.1, 0.7, lum));
      // saturation keyed to ENERGY (bright + already-coloured pixels): the rift pops, the dragon stays cool
      float sat = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));
      float e = smoothstep(0.30, 0.65, lum) * smoothstep(0.12, 0.35, sat);
      col = mix(vec3(lum), col, mix(${VIBE.toFixed(2)}, 1.95, e));             // base saturation (owner: a bit more vibrant)
      col = mix(col, col * vec3(1.04, 0.93, 1.08), smoothstep(0.03, 0.5, lum) * ${(VIBE - 0.85).toFixed(2)} * 2.0 * (1.0 - smoothstep(0.05, 0.25, col.g - col.r)));   // purple push in the mids (cyan accents exempt)
      col.r += 0.16 * e * smoothstep(0.45, 0.95, lum);                // hottest energy leans magenta
      col = clamp(col, 0.0, 1.0);
      col = col * col * (3.0 - 2.0 * col) * 0.35 + col * 0.65;   // S-curve: gives the dragon's mids form
      col = col * 0.96 + vec3(0.012, 0.005, 0.022);                 // violet-black floor, matches the site hero
      col = mix(col, vec3(1.0, 0.88, 1.0) * max(col.r, max(col.g, col.b)), smoothstep(0.88, 1.0, lum) * 0.35);   // white-pink cores (keep their violet)
      float v = smoothstep(0.95, 0.2, length(c * vec2(uAspect * 0.7, 1.0)));
      col *= mix(1.0, v, uVignette);
      // film grain at 24fps, weighted to the mids (also dithers gradient banding)
      float g = fract(sin(dot(vUv * vec2(1731.0, 977.0) + floor(uTime * 24.0), vec2(12.9898, 78.233))) * 43758.5453);
      col += (g - 0.5) * 0.018 * (1.0 - abs(lum - 0.5) * 1.4);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(new OutputPass());   // tone map + sRGB first …
composer.addPass(grade);              // … then grade in display space

// ─── dragon ─────────────────────────────────────────────────────────────────
const rig = new THREE.Group(); scene.add(rig);     // animated by the timeline
const orient = new THREE.Group(); rig.add(orient); // normalizes model facing/scale
const wingU = { uWingGlow: { value: 0 }, uWingR: { value: 1 }, uWingShade: { value: 0 } };
// Veil: until the dragon emerges, any part of it in front of the rift plane is
// clipped unless it's inside the tear — it can only come *through* the hole.
const veilU = { uVeil: { value: 1 }, uSealed: { value: 1 }, uHalfOpen: riftUniforms.uHalfOpen, uAngle: riftUniforms.uAngle, uLen: riftUniforms.uLen, uTime: riftUniforms.uTime,
  uGripY: riftUniforms.uGripY, uGripW: riftUniforms.uGripW, uGripK: riftUniforms.uGripK, uGripC: riftUniforms.uGripC,
  uClaw0: riftUniforms.uClaw0, uClaw1: riftUniforms.uClaw1, uClawR: { value: 0 } };
function addVeil(sh, overrides) {
  Object.assign(sh.uniforms, veilU, overrides || {});
  sh.vertexShader = "varying vec3 vWorldP;\n" + sh.vertexShader.replace(
    "#include <project_vertex>", "#include <project_vertex>\n vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  sh.fragmentShader = `uniform float uVeil, uSealed, uHalfOpen, uAngle, uLen, uTime, uGripY, uGripW, uGripK, uGripC, uClawR; uniform vec2 uClaw0, uClaw1; varying vec3 vWorldP;\n${TEAR_GLSL}\n` +
    sh.fragmentShader.replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
      // the gripping hands may curl over the lip, in front of the fabric
      bool hand = min(distance(vWorldP.xy, uClaw0), distance(vWorldP.xy, uClaw1)) < uClawR;
      if (uVeil > 0.5 && vWorldP.z > 0.0 && !hand) {
        if (uSealed > 0.5) discard;              // breach: nothing but the claw crosses the rift
        vec2 r = t_rot(vWorldP.xy / ${TEAR_SPACE}.0 + 0.5, uAngle);
        if (abs(r.x - t_spine(r.y, uTime)) > t_half(r.y, uHalfOpen, uLen)) discard;
      }`);
}
const veinU = { uVein: { value: 0 } };
const BODY_TONE = Number(params.get("bodyTone") || 1.0);
// Silhouette rim: view-angle (fresnel) edge glow on body + wings so the dragon's outline pops off the void
const rimU = { uRim: { value: 0 }, uRimCol: { value: new THREE.Color(0.85, 0.42, 1.0) } };
const RIM_K = Number(params.get("rim") || 1.2);
const RIM_GLSL = (k) => `
       float rimF = smoothstep(0.72, 0.95, 1.0 - abs(dot(normalize(normal), normalize(vViewPosition))));   // thin edge only
       totalEmissiveRadiance += uRimCol * rimF * uRim * ${k};`;
let mixer, actions = {}, eyeMats = [], eyeMeshes = [], headBone, bones = [];
const wingMats = [];

const draco = new DRACOLoader().setDecoderPath(opts.dracoPath || "https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(`${assetBase}netherwing_pollux_flap.glb`,   // + Blender-authored Flap clip
  (xhr) => window.dispatchEvent(new CustomEvent("glbProgress", { detail: { loaded: xhr.loaded, total: xhr.total } })));   // hero's "Loading the dragon (x MB)"
const model = gltf.scene;
orient.add(model);
model.traverse((o) => {
  if (o.isBone) bones.push(o);
  if (o.isMesh) {
    o.frustumCulled = false;
    const m = o.material;
    if (m.name.includes("Wing")) { patchWing(m); wingMats.push({ m, base: m.color.clone() }); }
    else if (m.name.includes("Body")) { patchVeins(m); m.color.multiplyScalar(BODY_TONE); }   // darker hide: the dragon reads as a shape against the void
  }
});
headBone = model.getObjectByName("Head_M_046");
const clawMesh = model.getObjectByName("Object_12");
clawMesh.material = clawMesh.material.clone();
clawMesh.material.onBeforeCompile = (sh) => addVeil(sh, { uSealed: { value: 0 } });
clawMesh.material.needsUpdate = true;

// Backlit wing membranes: emissive pink scaled by texture brightness and a
// view-angle term — translucency when the key light is behind the wing.
function patchWing(m) {
  m.onBeforeCompile = (sh) => {
    addVeil(sh);
    Object.assign(sh.uniforms, wingU, rimU);
    sh.fragmentShader = "uniform float uWingGlow; uniform float uWingR; uniform float uWingShade; uniform float uRim; uniform vec3 uRimCol; varying vec3 vWingP;\n" + sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       float wl = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114));
       float facing = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
       float ramp = smoothstep(0.15, 1.0, length(vWingP.xz) / uWingR);   // membrane edges glow more than the root
       totalEmissiveRadiance += mix(vec3(0.45,0.15,0.95), vec3(0.95,0.55,1.0), ramp) * uWingGlow * (0.2 + wl * 1.2) * pow(facing, 2.0) * 1.6 * (0.3 + ramp);${RIM_GLSL("0.25")}`).replace(
      "#include <opaque_fragment>",
      // backlit membrane: faces turned to camera sit in light shadow, edges + tips stay bright
      `outgoingLight *= 1.0 - uWingShade * (1.0 - facing) * (1.0 - 0.5 * ramp);
       #include <opaque_fragment>`);
    sh.vertexShader = "varying vec3 vWingP;\n" + sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\n vWingP = transformed;");
  };
  m.needsUpdate = true;
}
// Red crack veins across the dark body: procedural (the model has no emissive map)
function patchVeins(m) {
  m.onBeforeCompile = (sh) => {
    addVeil(sh);
    Object.assign(sh.uniforms, veinU, rimU);
    sh.vertexShader = "varying vec3 vObjPos;\n" + sh.vertexShader.replace(
      "#include <skinning_vertex>", "#include <skinning_vertex>\n vObjPos = transformed;");
    sh.fragmentShader = `uniform float uVein; uniform float uRim; uniform vec3 uRimCol; varying vec3 vObjPos;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
                   mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
      ` + sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       vec3 vp = vObjPos * 0.9;
       float n = n3(vp) * 0.65 + n3(vp * 2.1) * 0.35;
       float vein = 1.0 - smoothstep(0.0, 0.016, abs(n - 0.5));
       vein *= smoothstep(0.52, 0.66, n3(vObjPos * 0.3 + 11.0));      // only in some regions
       float dark = 1.0 - smoothstep(0.25, 0.65, dot(diffuseColor.rgb, vec3(0.299,0.587,0.114)));
       float pulse = 0.75 + 0.25 * sin(uTime * 5.0 + n * 12.0);
       totalEmissiveRadiance += vec3(1.0, 0.06, 0.14) * vein * dark * uVein * pulse * 2.4;${RIM_GLSL("1.0")}`);
  };
  m.needsUpdate = true;
}

mixer = new THREE.AnimationMixer(model);
for (const clip of gltf.animations) {
  const key = clip.name.includes("_Ani_") ? clip.name.split("_Ani_")[1] : clip.name;
  actions[key] = mixer.clipAction(clip);
}
for (const a of Object.values(actions)) { a.play(); a.weight = 0; }

function setClips(list) {
  for (const a of Object.values(actions)) a.weight = 0;
  for (const [k, time, w] of list) { actions[k].time = time; actions[k].weight = w; }
  mixer.update(0);
}

// Normalize: face +z (toward camera), wingspan ≈ 5.2 units, centered on the spine
{
  setClips([["StandBy", 0, 1]]); model.updateMatrixWorld(true);
  const v = (n) => model.getObjectByName(n).getWorldPosition(new THREE.Vector3());
  const fwd = v("Head_M_046").sub(v("Tail_00_JNT_0189")); fwd.y = 0;
  orient.rotation.y = -Math.atan2(fwd.x, fwd.z);
  orient.updateMatrixWorld(true);
  const box = new THREE.Box3(), p = new THREE.Vector3();
  bones.forEach((b) => box.expandByPoint(b.getWorldPosition(p)));
  orient.scale.setScalar(5.2 / box.getSize(p).x);
  orient.updateMatrixWorld(true);
  orient.position.sub(v("Spine1_M_016"));
  orient.updateMatrixWorld(true);
  wingU.uWingR.value = 2.6 / orient.scale.x;
}

// Eyes: HDR red spheres on the eye bones, sized in world units
// Owner (twice): the eyes bulged out of the sockets. The eye bone's local x points straight out of the face,
// and the old 1.3 squash there made each eye a capsule sticking forward; now a flat almond lens sitting in
// the socket (depth 0.6), 20% smaller, with a smaller glow. Sinking it deeper instead hid it at 3/4 views.
const EYE_SINK = Number(params.get("eyeSink") || 0);         // world units pushed into the skull
const EYE_R = Number(params.get("eyeR") || 0.024);           // eyeball radius (world units, before the squash below)
const EYE_GLOW = Number(params.get("eyeGlow") || 0.09);      // glow sprite size
const EYE_DEPTH = Number(params.get("eyeDepth") || 0.6);     // squash along the eye bone's local x (out of the face)
for (const name of ["Eye_L_047", "Eye_R_048"]) {
  const bone = model.getObjectByName(name);
  const ws = bone.getWorldScale(new THREE.Vector3()).x;
  const mat = new THREE.MeshBasicMaterial({ color: 0xe51247, transparent: true });
  mat.onBeforeCompile = (sh) => addVeil(sh);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(EYE_R / ws, 16, 12), mat);
  eye.scale.set(EYE_DEPTH, 0.6, 0.7); eye.renderOrder = 5;
  bone.add(eye); eyeMats.push(mat); eyeMeshes.push(eye);
  // Sunk into the socket (owner: they bulged out): push back toward the skull centre
  const inward = headBone.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const local = bone.worldToLocal(bone.getWorldPosition(new THREE.Vector3()).addScaledVector(inward, EYE_SINK)).sub(bone.worldToLocal(bone.getWorldPosition(new THREE.Vector3())));
  eye.position.copy(local);
}

const eyeGlows = eyeMeshes.map(() => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(1.0, 0.31, 0.82), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  sp.scale.setScalar(EYE_GLOW); sp.renderOrder = 6; scene.add(sp); return sp;
});
const _eg = new THREE.Vector3(), _ec = new THREE.Vector3(), _ed = new THREE.Vector3();

// ─── the timeline (6.3s) ────────────────────────────────────────────────────
const DX = 0.12;          // the dragon and the tear share a midline (the camera sits a touch right of it)
// Lunge through the tear: smootherstep, so it starts from rest (eOut2 started at full speed and jolted the
// whole body, ~60× the median acceleration) and peaks in acceleration mid-downstroke (~2.46), driven by the wings
const eLunge = (u) => u * u * u * (u * (6 * u - 15) + 10);
// Bolt axis: straight at the roar camera, shifted just over its left shoulder so the dragon
// fills the frame and punches past the lens instead of flying through it.
const BOLT_X = Number(params.get("boltX") || 4.4), BOLT_Y = Number(params.get("boltY") || 1.6);
const BOLT_START = new THREE.Vector3(0, 0.42, 1.3), BOLT_END = new THREE.Vector3(BOLT_X, BOLT_Y, 7.4);
const BOLT_DIR = BOLT_END.clone().sub(BOLT_START).normalize();
// Camera: [pos xyz, target xyz, fov, headTrack]. The camera never crosses to
// the dragon's left (x >= 0): one continuous take, one side of the axis.
// ONE continuous take (owner: no cuts, no jumps) — spline through these keys.
const CAM = [
  // anticipation + breach: slow push-in on the crack; the dragon faces us behind the fabric
  { t: 0.0, v: [0.3, 0.1, 5.2,   0, 0, -2,     45, 0] },
  { t: 1.4, v: [0.3, 0.04, 4.3, 0, 0, -1.5,    40, 0.15] },
  // the struggle: push in so the claws forcing the edges read
  { t: 1.95, v: [0.3, -0.1, 3.3, 0, -0.1, -0.8, 37, 0.1] },
  // emergence: square-on, easing back a touch as it pushes through
  { t: 2.3, v: [0.35, -0.08, 3.45, 0, 0.2, -0.4, 37, 0.3] },
  // glide round to the owner's roar angle, arriving for the roar peak (3.45)
  { t: 2.9, v: [1.3, 0.25, 4.35, 0, 0.7, 0.6,  37, 0.75] },
  { t: 3.4, v: [2.6, 0.49, 4.05, 0, 1, 1,      31, 1] },
  { t: 4.2, v: [2.45, 0.52, 3.8,  0, 1, 1,      30, 1] },
  // bolt: the roar angle holds (aim frozen where the head was — it doesn't chase the dragon) …
  { t: 4.4, v: [2.44, 0.52, 3.78, 0.28, 1.17, 2.65, 30, 0] },
  // … then pans home to the exact opening shot, flat on the rift. The intro ends here.
  { t: 5.3, v: [0.3, 0.1, 5.2,   0, 0, -2,     45, 0] },        // lands, then holds still to the end
];
// Phase 2 body mechanics (coil, strike, pull, burst) are all in the RiftOpen clip; this track only
// carries the dragon up to the fabric and, once the wings burst the tear, through it. Same keys as
// RIG in _blender/build_riftopen.py (the clip's claws are solved against them).
const DRAGON = [
  { t: 0.0, v: [DX, 0, -2.6, 0] },
  { t: 0.8, v: [DX, 0, -2.3, 0] },
  { t: 1.05, v: [DX, 0, -2.0, 0] },
  { t: 1.3, v: [DX, 0, -1.3, 0], e: eIO },          // closes on the fabric under the claw strike
  { t: 2.40, v: [DX, 0, -1.3, 0] },                  // holds while the claws pull the tear open …
  { t: 2.68, v: [0.12, 0.12, 0.55, -0.06], e: eLunge }, // … then lunges through once it's open — short and weighty
  { t: 3.4, v: [0.05, 0.35, 1.05, -0.08] },           // creeps forward into the roar
  { t: 4.2, v: [0, 0.5, 1.4, -0.05] },
  { t: 4.32, v: [0, 0.42, 1.3, 0.12] },              // coils back for a beat …
  { t: 4.95, v: [BOLT_END.x, BOLT_END.y, BOLT_END.z, 0], e: eIn },   // … and bolts past the lens, accelerating
];
// No impulse at the claw strike (1.3): its high-frequency rattle landed right as the head first
// shows through the tear and read as the neck glitching (owner)
const IMPULSES = [[0.5, 0.015], [0.9, 0.025], [4.72, 0.04], [2.55, 0.05], [3.45, 0.12], [4.34, 0.06]];

let idleBase = 0;
// RiftOpen (Blender, _blender/build_riftopen.py) is the whole rift opening as one authored clip, played
// in real timeline time from RO_T0: idle → coil → claw strike → second claw → load → pull → wing burst.
// It starts on the StandBy pose and ends on Skill02 frame 14, so both hand-offs are pose-matched.
const RO_T0 = 0.7, RO_END = RO_T0 + actions.RiftOpen.getClip().duration;
function clipPlan(t, idleClock) {
  const wRO = eIO(seg(t, RO_T0, 0.98)), w02 = eIO(seg(t, 2.62, RO_END)), w22 = eIO(seg(t, 2.8, 3.25));
  const wFl = eIO(seg(t, 4.05, 4.3));                          // Flight takes over for the launch
  // Skill02 runs in step with the clip's last stretch (frames 4 → 14), then on at its own speed
  const s02 = t < RO_END ? lerp(4, 14, seg(t, 2.52, RO_END)) / 24 : 14 / 24 + (t - RO_END);
  // Roar: head-thrust / jaw-open peak lands at 3.45, then held
  const s22 = t < 3.45 ? 0.3 + 0.3 * seg(t, 2.95, 3.45) : 0.6 + 0.5 * seg(t, 3.45, 4.2);
  const crown = 0.55 * eIO(seg(t, 2.85, 3.25));                // wings held in the upstroke "crown"
  return [
    ["StandBy", (idleClock + t) % 3.0, 1 - wRO],
    ["RiftOpen", clamp(t - RO_T0, 0, RO_END - RO_T0), wRO * (1 - w02)],
    ["Skill02", s02, w02 * (1 - w22)],
    ["Skill22", s22, w22 * (1 - crown) * (1 - wFl)],
    ["Flap", 0.30, w22 * crown * (1 - wFl)],
    ["Flight", flapTime(t), wFl],
  ];
}
// Flap clip: 3.0s loop = 4 beats (18 frames @24fps). Beat rate ramps up for the launch.
function flapTime(t) {
  const x = Math.max(0, t - 4.05);
  return (x + 1.3 * Math.max(0, t - 4.3)) % 3.0;       // beat rate more than doubles for the bolt
}

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3();
// Letterbox bars + flash live inside the container (absolutely positioned over the canvas)
const overlay = (css) => { const d = document.createElement("div"); d.style.cssText = "position:absolute;left:0;right:0;pointer-events:none;" + css; container.appendChild(d); return d; };
const barTop = overlay("top:0;height:0;background:#000;z-index:2;"), barBot = overlay("bottom:0;height:0;background:#000;z-index:2;");
const flashEl = overlay("top:0;bottom:0;opacity:0;z-index:3;background:radial-gradient(ellipse at center,#fff 0%,#f0c9e4 22%,#8f78c4 55%,#0c0716 100%);");
const spine1 = model.getObjectByName("Spine1_M_016");
// Procedural head aim, spread over the neck so it bends instead of snapping at the skull.
// Head-local snout/top axes are measured once in the StandBy pose.
const FACE_OUT = new THREE.Vector3(0, 0, 1), WORLD_UP = new THREE.Vector3(0, 1, 0);
const _hp = new THREE.Vector3(), _toCam = new THREE.Vector3(), _aimDir = new THREE.Vector3();
const AIM_CHAIN = ["Neck1_M_043", "Neck3_M_045", "Head_M_046"].map((n) => model.getObjectByName(n));
const AIM_SHARE = [0.3, 0.45, 1.0];                              // fraction of the remaining error per bone
const headAxes = (() => {
  setClips([["StandBy", 0, 1]]); model.updateMatrixWorld(true);
  const hp = headBone.getWorldPosition(new THREE.Vector3());
  const eyes = model.getObjectByName("Eye_L_047").getWorldPosition(new THREE.Vector3())
    .add(model.getObjectByName("Eye_R_048").getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
  const snout = eyes.sub(hp).normalize();
  const top = WORLD_UP.clone().addScaledVector(snout, -snout.y).normalize();
  const qi = headBone.getWorldQuaternion(new THREE.Quaternion()).invert();
  return { snout: snout.applyQuaternion(qi), top: top.applyQuaternion(qi) };
})();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _x = new THREE.Vector3(), _up = new THREE.Vector3();
const _localBasis = new THREE.Matrix4().makeBasis(headAxes.snout, headAxes.top, _x.crossVectors(headAxes.snout, headAxes.top));
function aimHead(dir, up, w) {
  _up.copy(up).addScaledVector(dir, -up.dot(dir)).normalize();
  _m2.makeBasis(dir, _up, _x.crossVectors(dir, _up));
  const target = _qa.setFromRotationMatrix(_m1.multiplyMatrices(_m2, _localBasis.clone().transpose()));
  AIM_CHAIN.forEach((bone, i) => {
    headBone.updateWorldMatrix(true, false);
    const err = _qb.copy(target).multiply(headBone.getWorldQuaternion(_qc).invert());   // world delta still needed
    const step = new THREE.Quaternion().slerp(err, AIM_SHARE[i] * w);
    const bw = bone.getWorldQuaternion(new THREE.Quaternion());
    const pw = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(pw.invert().multiply(step).multiply(bw));
    bone.updateMatrixWorld(true);
  });
}

const boneBy = (prefix) => { let b = null; model.traverse((o) => { if (!b && o.isBone && o.name.startsWith(prefix)) b = o; }); return b; };
// Upper-arm skin helpers: ElbowUpper_* carries the upper-arm skin near the elbow but is parented
// to the elbow with a fixed offset; in the grip pose the right one lands past the shoulder by the
// neck, stretching the upper arm into a rod through the neck (owner). During the grip, pin each
// helper on the upper arm (between shoulder and elbow) so the skin stays on the arm.
const ARM_HELPERS = ["L", "R"].map((s) => ({ helper: boneBy(`ElbowUpper_${s}_`), shoulder: boneBy(`Shoulder_${s}_`), elbow: boneBy(`Elbow_${s}_`) }));
const _h1 = new THREE.Vector3(), _h2 = new THREE.Vector3();
const HELPER_AT = Number(params.get("helperAt") || 0.55);          // 0 = at the elbow … 1 = at the shoulder
function followShoulder(w) {
  for (const h of ARM_HELPERS) {
    h.shoulder.getWorldPosition(_h1); h.elbow.getWorldPosition(_h2);
    const target = _h2.lerp(_h1, HELPER_AT);
    const local = h.helper.parent.worldToLocal(target.clone());
    h.helper.position.lerp(local, w); h.helper.updateMatrixWorld(true);
  }
}
// Each hand's contact with the lip = its outermost point across the tear (wrist + talon tips)
const HANDS = ["L", "R"].map((s) => ({ side: s === "L" ? 1 : -1,
  pts: ["Wrist", "IndexFinger3", "MiddleFinger3", "PinkyFinger3", "ThumbFinger3"].map((n) => boneBy(`${n}_${s}_`)) }));
const _tip = new THREE.Vector3(), _hand = new THREE.Vector3();
const _corner = new THREE.Vector3(), _dir = new THREE.Vector3();
function frustumOnRift() {
  camera.updateMatrixWorld(true);
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    _corner.set(x, y, 0.5).unproject(camera);
    _dir.copy(_corner).sub(camera.position).normalize();
    if (_dir.z > -0.05) return false;                                   // ray never reaches the rift
    const k = -camera.position.z / _dir.z;
    const hx = camera.position.x + _dir.x * k, hy = camera.position.y + _dir.y * k;
    if (Math.abs(hx) > RIFT_SIZE * 0.46 || Math.abs(hy) > RIFT_SIZE * 0.46) return false;   // past the edge
  }
  return true;
}

let lastWall = 0, camGuard = 0;
// Perspective framing is tuned for landscape; below 1.25:1 widen the vertical FOV so phones
// keep the horizontal view (capped to avoid fisheye) — same rule as viewport.js fitPerspective.
function fitFov(baseFov) {
  const aspect = camera.aspect;
  if (aspect >= 1.25) return baseFov;
  return Math.min(80, (Math.atan(Math.tan((baseFov * Math.PI) / 360) * (1.25 / aspect)) * 360) / Math.PI);
}
function applyTimeline(t, idleClock, wall) {
  // Clips + wings
  setClips(clipPlan(t, idleClock));
  // Body rises on each downstroke (beat phase matches the Flap clip, 18 frames/beat)
  const beat = 2 * Math.PI * (flapTime(t) * 24) / 18;
  const lift = -Math.sin(beat + 0.45 * Math.sin(beat)) * eIO(seg(t, 4.05, 4.3));

  // Dragon transform (bobs with each wingbeat)
  const d = track(DRAGON, t);
  rig.position.set(d[0], d[1] + lift * 0.1 + (t === 0 ? Math.sin(wall * 1.3) * 0.03 : 0), d[2]);
  // Body stays upright and square to the rift, in line with the face (owner: no roll)
  rig.rotation.z = 0;
  // Bolt: body turns onto the bolt axis (yaw + pitch)
  const wb = eIO(seg(t, 4.26, 4.45));
  rig.rotation.order = "YXZ";
  rig.rotation.y = Math.atan2(BOLT_DIR.x, BOLT_DIR.z) * wb;
  rig.rotation.x = d[3] + lift * 0.07 - Math.atan2(BOLT_DIR.y, Math.hypot(BOLT_DIR.x, BOLT_DIR.z)) * wb;
  rig.visible = t < 5.05;
  rig.updateMatrixWorld(true);
  // (RiftOpen is authored square to the rift and turns into Skill02's heading itself during the burst)
  // Breach + emergence: the face stays square to the rift, looking straight out at us
  const camNow = smoothTrack(CAM, t);
  // Claws on the tear's edges (the clip puts them there: the strike lands 1.27/1.36, the claws let go
  // 2.38–2.56 as the wings take over). kGrip only drives the tear-from-claws coupling and the claw FX.
  const kGrip = eIO(seg(t, 1.2, 1.45)) * (1 - eIO(seg(t, 2.38, 2.5)));
  const ang = (lerp(38, 14, eIO(seg(t, 1.3, 2.5))) + Math.sin(eIO(seg(t, 1.3, 2.5)) * Math.PI) * 3) * Math.PI / 180;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  followShoulder(eIO(seg(t, 0.75, 0.95)));                        // upper-arm skin stays on the arm for the rest of the intro (rod fix)
  // Head aim LAST. Through the rift opening RiftOpen aims its own head at the lens (stabilised, with the
  // neck following the body); this takes over as the clip hands off to Skill02, then to the roar clip.
  headBone.getWorldPosition(_hp); _toCam.set(camNow[0], camNow[1], camNow[2]).sub(_hp).normalize();
  const wAim = Math.max(1 - eIO(seg(t, RO_T0, 0.98)), eIO(seg(t, 2.42, 2.66))) * (1 - eIO(seg(t, 2.85, 3.2)));   // idle → clip → Skill02/roar
  const strain = 0.5 * eIO(seg(t, 1.4, 1.9)) * (1 - eIO(seg(t, 2.2, 2.6)));   // head lowers slightly, steadily
  if (wAim > 0) aimHead(_aimDir.copy(FACE_OUT).lerp(_toCam, 0.7).normalize().add(_hp.set(0, -0.26 * strain, 0)).normalize(), WORLD_UP, wAim);
  if (wb > 0) aimHead(BOLT_DIR, WORLD_UP, 0.85 * wb);            // head leads along the bolt
  // Tear edges from the fingertips (world → tear space: across = (cos a, −sin a), along = (sin a, cos a))
  let acr0 = 0, acr1 = 0, alg = 0;
  // claw FX strength: builds once the claws are on the edges, flares on each heave, gone on release
  const kClaw = params.has("nofx") ? 0 : clamp(0.55 * eIO(seg(t, 1.3, 1.55)) * kGrip * (1 - seg(t, 2.4, 2.48)), 0, 1.2);   // only while the claws hold the edges
  riftUniforms.uClawK.value = kClaw;
  veilU.uClawR.value = 0.32 * kGrip;
  auraMat.uniforms.uK.value = kClaw; auraMat.uniforms.uTime.value = t;
  const fp = fleckGeo.attributes.position.array, fs = fleckGeo.attributes.aSize.array, fa = fleckGeo.attributes.aAlpha.array;
  HANDS.forEach((hnd, i) => {
    let best = -Infinity;                                   // outermost point of this hand across the tear
    for (const b of hnd.pts) {
      b.getWorldPosition(_hand);
      // hands sit behind the rift plane: project along the camera ray onto it so the edge
      // lines up with the claws as SEEN (otherwise parallax puts the lip ~50px outboard)
      const kz = camNow[2] / (camNow[2] - _hand.z);
      _hand.set(camNow[0] + (_hand.x - camNow[0]) * kz, camNow[1] + (_hand.y - camNow[1]) * kz, 0);
      const a = ca * _hand.x - sa * _hand.y;
      if (a * hnd.side > best) { best = a * hnd.side; _tip.copy(_hand); }
    }
    const a = ca * _tip.x - sa * _tip.y; if (i === 0) acr0 = a; else acr1 = a;
    alg += (sa * _tip.x + ca * _tip.y) / 2;
    _tip.x += ca * hnd.side * 0.02; _tip.y -= sa * hnd.side * 0.02;     // FX sit ON the lip where the talons bite
    (i === 0 ? riftUniforms.uClaw0 : riftUniforms.uClaw1).value.set(_tip.x, _tip.y);
    clawLights[i].position.set(_tip.x, _tip.y, -0.15); clawLights[i].intensity = 1.6 * kClaw;
    auras[i].position.set(_tip.x, _tip.y, 0.05); auras[i].quaternion.copy(camera.quaternion); auras[i].visible = kClaw > 0.01;
    for (let j = 0; j < FLECK_N; j++) {
      const sd = fleckSeeds[i * FLECK_N + j], k = i * FLECK_N + j;
      const life = (sd.u + t * sd.v) % 1;                                  // each fleck drifts outward, then respawns
      const r = 0.02 + 0.31 * life * life;
      fp[k * 3] = _tip.x + Math.cos(sd.a) * r; fp[k * 3 + 1] = _tip.y + Math.sin(sd.a) * r * 0.9; fp[k * 3 + 2] = 0.06;
      fs[k] = 0.06 * sd.s * (1 - 0.55 * life);
      const blink = Math.sin(t * 40 + sd.ph) > -0.2 ? 1 : 0.15;             // pixel flicker
      fa[k] = Math.min(1, kClaw * 1.3) * (1 - life) * blink * 0.75;
    }
  });
  fleckGeo.attributes.position.needsUpdate = fleckGeo.attributes.aSize.needsUpdate = fleckGeo.attributes.aAlpha.needsUpdate = true;
  flecks.visible = kClaw > 0.01;
  riftUniforms.uGripK.value = kGrip;
  // as the wing burst takes over, the edge keeps widening (the hands drift in slightly here)
  riftUniforms.uGripW.value = ((Math.abs(acr0 - acr1) / 2 - 0.04) * (1 + 0.2 * eIO(seg(t, 2.34, 2.6)))) / TEAR_SPACE;   // edge just inside the claws: they hook over the lip
  riftUniforms.uGripC.value = ((acr0 + acr1) / 2) / TEAR_SPACE;
  riftUniforms.uGripY.value = 0.5 + alg / TEAR_SPACE;

  // Camera + impact-only shake
  const c = smoothTrack(CAM, t); c[7] = clamp(c[7], 0, 1);
  if (c[7] > 0) { headBone.getWorldPosition(tmp2); c[3] = lerp(c[3], tmp2.x, c[7]); c[4] = lerp(c[4], tmp2.y, c[7]); c[5] = lerp(c[5], tmp2.z, c[7]); }
  let amp = 0; for (const [ti, a] of IMPULSES) amp += a * impulse(t, ti, 8);
  const sx = amp * (Math.sin(t * 83) + 0.5 * Math.sin(t * 47.3)), sy = amp * (Math.cos(t * 71) + 0.5 * Math.sin(t * 59.1));
  const drift = t === 0 ? 1 : 0;
  camera.position.set(c[0] + sx + drift * Math.sin(wall * 0.3) * 0.05, c[1] + sy + drift * Math.sin(wall * 0.23) * 0.03, c[2] + 0.25 * bell(t, 2.42, 2.66));   // recoil as it lunges
  const tgt = tmp3.set(c[3] + sx * 0.5, c[4] + sy * 0.5, c[5]);
  const fov = fitFov(c[6]);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.lookAt(tgt);
  // Rift-only guard: every frustum corner must land on the rift plane (z=0, inside
  // its 120-unit extent). If not, tip the aim back toward the rift until it does.
  // Fine steps: the correction is the minimum needed, so it varies smoothly with t (no pops).
  const view = params.get("view");                               // debug turnaround for reviews: side | top | q34 | back
  if (view) {
    spine1.getWorldPosition(tmp2);
    const off = { side: [5.2, 0.4, 0.3], top: [0, 5.4, 0.3], q34: [3.8, 1.1, 3.0], back: [0, 0.8, -5.2], low: [0.4, -3.6, 3.6] }[view];
    camera.position.set(tmp2.x + off[0], tmp2.y + off[1], tmp2.z + off[2]); camera.fov = 35; camera.updateProjectionMatrix(); camera.lookAt(tmp2);
    rift.visible = rays.visible = tearCore.visible = false;
  }
  for (let i = 0; i < 600 && !view && !frustumOnRift(); i++) {
    tgt.z -= 0.02; tgt.y -= 0.007; camera.lookAt(tgt); camGuard++;
  }

  // Rift: narrow tear (shoulder-width) until the wing burst, then it rips wide
  const crackP = t < 1.3 ? 0.28 + 0.4 * seg(t, 0.1, 1.3) + 0.35 * impulse(t, 0.5, 9) + 0.45 * impulse(t, 0.9, 9) + 0.18 * Math.sin(t * 12 + wall * 2) * (0.4 + seg(t, 0.1, 1.3)) : 1;
  const riftP = eIO(seg(t, 1.3, 2.5));
  riftUniforms.uCrackP.value = crackP;
  riftUniforms.uRiftP.value = riftP;
  // While gripped the claws set the width (uGrip*); the wing burst then rips it wide, and it
  // settles to a readable tear for the final frame
  riftUniforms.uHalfOpen.value = t < 1.3 ? 0 : 0.0006 + eOut(seg(t, 1.3, 1.5)) * 0.006 + eIO(seg(t, 2.3, 2.75)) * 0.1 * (1 - 0.8 * eIO(seg(t, 5.0, 5.4)));
  riftUniforms.uLen.value = t < 1.3 ? 0.02 + 0.03 * seg(t, 0.1, 1.3) : 0.05 + 0.04 * seg(t, 1.3, 1.9) + 0.07 * eOut(seg(t, 2.35, 2.8)) * (1 - 0.3 * eIO(seg(t, 5.0, 5.4)));
  veilU.uVeil.value = t < 2.8 ? 1 : 0;
  veilU.uSealed.value = t < 1.9 ? 1 : 0;                 // body stays behind the rift until it pushes through
  // claws always on: the veil still hides them until the tear opens
  riftUniforms.uAngle.value = (lerp(38, 14, riftP) + Math.sin(riftP * Math.PI) * 3) * Math.PI / 180;
  riftUniforms.uBurstGlow.value = 0.15 * impulse(t, 0.5, 9) + 0.22 * impulse(t, 0.9, 9) + 0.55 * impulse(t, 1.3, 6) + 0.4 * impulse(t, 2.55, 4);
  riftUniforms.uTime.value = wall;

  // Suction streaks (anticipation)
  const sw = bell(t, 0.05, 1.4);
  suck.material.opacity = sw * 0.6; suck.visible = sw > 0.01;
  if (suck.visible) {
    const arr = suckGeo.attributes.position.array;
    suckSeeds.forEach((sd, i) => {
      const u = (t * 0.9 + sd.ph) % 1, k = eIn(u), k2 = eIn(Math.max(0, u - 0.06));
      const put = (o, kk) => { arr[o] = Math.cos(sd.a) * sd.r * (1 - kk); arr[o + 1] = sd.y * (1 - kk * 0.8); arr[o + 2] = sd.z * (1 - kk) + 0.02; };
      put(i * 6, k); put(i * 6 + 3, k2);
    });
    suckGeo.attributes.position.needsUpdate = true;
  }

  // Backlight through the tear
  const raysI = t < 1.3 ? 0 : eOut(seg(t, 1.3, 2.0)) * (1 + 0.6 * impulse(t, 2.55, 2)) * (1 - 0.5 * seg(t, 5.0, 6.8));
  rays.material.opacity = raysI * 0.55; rays.material.rotation = wall * 0.03;
  tearCore.material.opacity = raysI * 0.25 * (1 - 0.5 * bell(t, 2.15, 2.55));
  swirl.material.opacity = 0.3 * raysI; swirl.material.rotation = -t * 0.35;
  tearLight.intensity = raysI * lerp(2.8, 6.3, seg(t, 2.2, 2.6));    // the tear lights the dragon from behind
  const early = lerp(0.5, 1, seg(t, 2.2, 2.6));                  // dragon stays a silhouette inside the void
  rimLight.intensity = rimLight2.intensity = 0.15 + raysI * 1.2 * early;   // side rims: shoulders + wing edges
  pinkBack.intensity = raysI * 1.3 * early;
  const tk = eIO(seg(t, 4.2, 4.6));
  headKey.target = rig; headKey.intensity = 0.65 * seg(t, 2.8, 3.3) * lerp(1, 0.5, tk);
  backKey.target = rig; backKey.intensity = 1.6 * seg(t, 2.6, 3.0) + 1.1 * tk;          // void backlight rims wings + horns
  fill.intensity = t < 2.45 ? 0.1 : 0.25;
  hemi.intensity = 0.30;
  wingU.uWingShade.value = WING_SHADE * seg(t, 1.2, 1.6);
  faceKey.target = rig; faceKey.intensity = FACE_K * seg(t, 1.2, 1.6);
  wingMats.forEach((w) => w.m.color.copy(w.base).multiplyScalar(lerp(1, 0.8, seg(t, 2.5, 2.9))));
  renderer.toneMappingExposure = 1.05 - 0.15 * bell(t, 2.5, 3.1);   // soften the exposure jump at the burst
  haze.forEach((h, i) => { h.material.opacity = 0.07 * seg(t, 1.4, 2.4) * (1 - seg(t, 4.9, 5.5)); h.material.rotation = wall * 0.02 * (i % 2 ? 1 : -1); });

  // Emissive accents
  wingU.uWingGlow.value = 0.7 * (0.03 + 0.2 * eOut(seg(t, 2.5, 2.9)) + 0.15 * tk);
  rimU.uRim.value = RIM_K * (0.35 + 0.65 * seg(t, 2.3, 2.7)) * seg(t, 1.2, 1.5);
  veinU.uVein.value = t < 2.5 ? 0.15 : 0.5 + 1.5 * Math.exp(-Math.pow((t - 3.45) * 2.5, 2));
  const eyeI = 1 + 2 * Math.exp(-Math.pow((t - 1.3) * 6, 2)) + 2.5 * Math.exp(-Math.pow((t - 3.45) * 5, 2)) + 1.5 * seg(t, 4.2, 4.5);
  eyeMats.forEach((m) => { m.color.setHex(0xe51247).multiplyScalar(4.5 * eyeI); });
  // Always-on soft glow just in front of each socket (sunk eyes can be hidden by the brow).
  // Fades as the head turns away so it never shines through the skull.
  headBone.getWorldPosition(_hp);
  eyeMeshes.forEach((e, i) => {
    e.getWorldPosition(_eg); _ec.copy(camera.position).sub(_eg).normalize();
    const facing = clamp(_ed.copy(_eg).sub(_hp).normalize().dot(_ec) * 2 + 0.3, 0, 1);
    eyeGlows[i].position.copy(_eg).addScaledVector(_ec, 0.08);
    eyeGlows[i].material.opacity = 0.5 * facing * Math.min(1.6, 0.7 + 0.3 * eyeI) * (rig.visible ? 1 : 0);
  });

  // Butterflies
  rushers.forEach((r, i) => {
    const t0 = 2.55 + i * 0.1, u = seg(t, t0, t0 + 0.55);
    r.sp.visible = u > 0 && u < 1;
    if (r.sp.visible) {
      r.sp.position.set(r.x * (1 + u * 2.2), r.y * (1 + u * 1.5), lerp(-3.2, -0.25, eIn(u)));
      r.sp.scale.setScalar(lerp(0.2, 1.3, eIn(u)));
      r.sp.material.rotation = r.rot + u * 2;
      r.sp.material.opacity = bell(u, 0, 1) * 0.7;
    }
  });
  swarm.forEach((b) => {
    const t0 = b.t0 - 0.78, dt = t - t0, u = seg(t, t0, t0 + 2.3);
    b.sp.visible = dt > 0 && u < 1;
    if (!b.sp.visible) return;
    b.sp.position.copy(b.o).addScaledVector(b.v, dt);
    b.sp.position.y += Math.sin(dt * 9 + b.ph) * 0.06;
    const flap = 0.55 + 0.45 * Math.abs(Math.sin(dt * 22 + b.ph));
    b.sp.scale.set(b.s * (1 + 1.6 * Math.exp(-dt * 2.5)) * flap, b.s, 1);
    b.sp.material.rotation = Math.atan2(b.v.y, b.v.x);
    const near = b.sp.position.distanceTo(camera.position);
    const clear = 1 - bell(t, 3.1, 4.0) * (1 - seg(b.sp.position.distanceTo(_hp), 0.45, 0.9));   // keep off the face in the roar
    b.sp.material.opacity = Math.min(1, dt * 6) * (1 - u) * seg(near, 0.8, 1.8) * clear;   // never smear across the lens
  });

  // Post
  grade.uniforms.uDesat.value = seg(t, 0.1, 0.9) * 0.3 * (1 - seg(t, 4.9, 5.5));
  grade.uniforms.uVignette.value = 0.3 + 0.35 * seg(t, 0.1, 0.9) * (1 - seg(t, 4.9, 5.5));
  grade.uniforms.uCA.value = Math.min(0.003, 0.0016 + 0.003 * impulse(t, 1.3, 6) + 0.002 * impulse(t, 2.55, 6) + 0.003 * impulse(t, 3.45, 5));
  grade.uniforms.uTime.value = wall;
  if (t > 3.4 && t < 4.2) {
    headBone.getWorldPosition(tmp).project(camera);
    grade.uniforms.uShockC.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
    grade.uniforms.uShockR.value = eOut(seg(t, 3.4, 4.15)) * 1.3;
    grade.uniforms.uShockS.value = 0.018 * (1 - seg(t, 3.4, 4.15));
  } else grade.uniforms.uShockS.value = 0;
  const dtf = clamp((wall - lastWall) * 60, 0.25, 4); lastWall = wall;
  const damp = Math.pow(0.8 * bell(t, 4.35, 5.05), dtf);         // speed smear on the bolt, same length at any frame rate
  afterimage.enabled = damp > 0.02;
  afterimage.uniforms.damp.value = damp;
  bloom.strength = Math.min(0.8, 0.45 + 0.25 * impulse(t, 1.3, 6) + 0.3 * impulse(t, 3.45, 4));

  // DOM: letterbox + flash into the hero palette
  const lb = eIO(seg(t, 0.1, 0.9)) * (1 - eIO(seg(t, 4.9, 5.5)));
  const barH = Math.min(innerHeight * 0.14, Math.max(0, (innerHeight - innerWidth / 2.39) / 2)) * lb;
  barTop.style.height = barBot.style.height = barH + "px";
  flashEl.style.opacity = 0;                                      // no flash: it ends on the opening shot
}

// ─── playback controller ────────────────────────────────────────────────────
let t = Number(params.get("t") || 0), playing = false, playStart = 0, playFrom = 0, raf = 0, disposed = false, doneFired = false;
const doneCbs = [];
function play() { if (t >= DURATION - 0.01) t = 0; playing = true; doneFired = false; playStart = performance.now(); playFrom = toReal(t); idleBase = (performance.now() / 1000) % 3; }
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth / 2, innerHeight / 2);
  grade.uniforms.uAspect.value = innerWidth / innerHeight;
}
addEventListener("resize", resize);
addEventListener("orientationchange", resize);

let lastRender = 0;
function frame(now) {
  if (disposed) return;
  raf = requestAnimationFrame(frame);
  if (document.hidden || (opts.shouldRender && !opts.shouldRender())) return;   // offscreen: skip the GPU work
  // Not playing (idle crack before the scroll, or the open rift behind the hero afterwards): the scene
  // barely moves, so render at ~30fps to halve the GPU work and heat; the cinematic itself runs full rate
  if (!playing && now - lastRender < 1000 / 30 - 2) return;
  lastRender = now;
  const wall = now / 1000;
  if (playing) { t = toTimeline(playFrom + (now - playStart) / 1000); if (t >= DURATION) { t = DURATION; playing = false; } }
  if (!playing && t >= DURATION && !doneFired) { doneFired = true; doneCbs.forEach((cb) => cb()); }
  applyTimeline(t, playing || t > 0 ? idleBase : wall % 3, wall);
  if (opts.onFrame) opts.onFrame(t, playing);
  composer.render();
}
raf = requestAnimationFrame(frame);

return {
  DURATION, PLAY_DURATION, SHOTS, camera, model,
  play,
  pause() { playing = false; },
  setT(x) { playing = false; t = x; },
  getT: () => t,
  isPlaying: () => playing,
  onDone(cb) { doneCbs.push(cb); },
  // head screen position + rift-guard hits at time x (review tooling)
  probe(x) {
    camGuard = 0; applyTimeline(x, idleBase, 0);
    const h = headBone.getWorldPosition(new THREE.Vector3()), sp = h.clone().project(camera);
    const u = riftUniforms;
    return { t: x, head: h.toArray().map((v) => +v.toFixed(2)), scr: [+sp.x.toFixed(2), +sp.y.toFixed(2)], guard: camGuard,
      // effective tear half-width at the claws (tear space): max(base, grip) blended by grip strength
      tear: +lerp(u.uHalfOpen.value, Math.max(u.uHalfOpen.value, u.uGripW.value), u.uGripK.value).toFixed(5) };
  },
  dispose() {
    disposed = true; cancelAnimationFrame(raf);
    removeEventListener("resize", resize); removeEventListener("orientationchange", resize);
    composer.dispose?.(); renderer.dispose();
    scene.traverse((o) => { o.geometry?.dispose?.(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { if (!m) return; for (const k in m) m[k]?.isTexture && m[k].dispose(); m.dispose?.(); }); });
    // remove only our own nodes (a remount may already share this container)
    [renderer.domElement, barTop, barBot, flashEl].forEach((el) => el.remove());
  },
};
}

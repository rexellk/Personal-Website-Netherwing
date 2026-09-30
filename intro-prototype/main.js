// Netherwing intro — standalone prototype (throwaway, not site code).
// Every visual is a pure function of timeline time `t` (0–8s) so any frame can
// be scrubbed and reviewed. Shot list: see the SHOTS table below.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const DURATION = 5.6;
const params = new URLSearchParams(location.search);
if (params.has("nohud")) document.getElementById("hud").classList.add("hidden");

const SHOTS = [
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

// ─── renderer / scene ────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
document.body.prepend(renderer.domElement);

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
const nebula = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.55, 0.12, 0.9), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
nebula.position.set(0, 0, -30); nebula.scale.set(55, 40, 1); scene.add(nebula);

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
const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTex, color: new THREE.Color(0.8, 0.45, 1.0), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
rays.position.set(0, 0, -1.4); rays.scale.set(14, 14, 1); scene.add(rays);
const tearCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(0.9, 0.35, 1.3), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
tearCore.position.set(0, 0, -2.2); tearCore.scale.set(3, 6, 1); scene.add(tearCore);

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
  // spine: jagged, non-periodic torn edge
  float t_spine(float y, float time){
    return 0.5 + (t_fbm(vec2(y*38.0, time*0.12)) - 0.5) * 0.014 + (t_noise(vec2(y*170.0, 7.0)) - 0.5) * 0.004;
  }
  // half-width: lens-shaped (tapers to points at both ends), uneven along its length
  float t_half(float y, float halfOpen, float len){
    float along = abs(y - 0.5);
    float taper = 1.0 - smoothstep(len * 0.25, len, along);
    return halfOpen * taper * (0.7 + 0.6 * t_fbm(vec2(y*55.0, 3.0)));
  }
`;
const riftUniforms = {
  uTime: { value: 0 }, uRiftP: { value: 0 }, uCrackP: { value: 0 }, uAngle: { value: 0.7 },
  uHalfOpen: { value: 0 }, uBurstGlow: { value: 0 }, uLen: { value: 0.03 },
};
const rift = new THREE.Mesh(
  new THREE.PlaneGeometry(RIFT_SIZE, RIFT_SIZE),
  new THREE.ShaderMaterial({
    uniforms: riftUniforms,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform float uTime, uRiftP, uCrackP, uAngle, uHalfOpen, uBurstGlow, uLen;
      ${TEAR_GLSL}
      void main(){
        vec2 ruv = t_rot((vUv - 0.5) * ${RIFT_SIZE / 30}.0 + 0.5, uAngle);
        float spine = t_spine(ruv.y, uTime);
        float dist = abs(ruv.x - spine);
        float hw = t_half(ruv.y, uHalfOpen, uLen);
        if (hw > 0.00005 && dist < hw) discard;
        vec2 fuv = ruv * 7.5;
        float cloth = clamp(t_fbm(fuv*24.0 + vec2(uTime*0.06,uTime*0.04))*0.55 + t_fbm(vec2(fuv.y*1.1,fuv.x*0.9)*20.0 - uTime*0.05)*0.45, 0.0, 1.0);
        vec3 col = mix(vec3(0.0), vec3(0.05,0.01,0.10), cloth*0.7);
        float along = abs(ruv.y - 0.5);
        float inTear = 1.0 - smoothstep(uLen * 0.6, uLen * 1.05, along);
        float ed = max(dist - hw, 0.0) * 4.0;            // plane-UV → ~screen-UV scale
        if (uHalfOpen > 0.00005) {
          float shimmer = 0.75 + 0.25 * t_noise(vec2(ruv.y * 400.0, uTime * 6.0));
          float burst = 1.0 + uBurstGlow * 3.0;
          float drive = max(uRiftP, uBurstGlow * 0.8);    // rim is hot at the moment of impact
          float core = exp(-ed*260.0) * drive * shimmer * burst * inTear;
          float mid  = exp(-ed*70.0)  * drive * shimmer * burst * 0.6 * inTear;
          float halo = exp(-ed*16.0)  * drive * 0.28 * burst * inTear;
          // ragged burnt fibres along the lip
          float fibres = step(0.62, t_noise(vec2(ruv.y * 900.0, dist * 900.0))) * exp(-ed*120.0) * drive * inTear;
          col += mix(vec3(0.75,0.3,1.0), vec3(1.0,0.9,1.0), core) * core * 1.6
               + vec3(0.62,0.1,0.95) * mid * 1.6 + vec3(0.2,0.02,0.42) * halo + vec3(1.0,0.5,1.0) * fibres * 1.5;
        }
        if (uCrackP > 0.0 && uRiftP < 0.3) {       // hairline crack before the tear
          float crack = exp(-dist * 5600.0) * uCrackP * inTear;
          col += vec3(0.8,0.45,1.0) * crack * (3.0 + uBurstGlow * 12.0);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  }),
);
scene.add(rift);

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
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0 }));
  sp.position.set(x, y, z); sp.scale.set(sc, sc * 0.6, 1); scene.add(sp); return sp;
});

// ─── lights: low-key, keyed from behind ─────────────────────────────────────
const hemi = new THREE.HemisphereLight(0x3a2a60, 0x050008, 0.35); scene.add(hemi);
const rimLight = new THREE.DirectionalLight(0xd8c8ff, 0); rimLight.position.set(0, 3, -6); scene.add(rimLight);
const pinkBack = new THREE.DirectionalLight(0xff66cc, 0); pinkBack.position.set(-4, -1, -5); scene.add(pinkBack);
const fill = new THREE.DirectionalLight(0xb8a0ff, 0.3); fill.position.set(2, 1, 6); scene.add(fill);
const tearLight = new THREE.PointLight(0xc080ff, 0, 6, 1.5); tearLight.position.set(0, 0, -1.2); scene.add(tearLight);
const clawLight = new THREE.PointLight(0xe8c0ff, 0, 3, 1.5); clawLight.position.set(0, 0, 0.5); scene.add(clawLight);
// Cool top-front key so the head and jaw read during the roar and launch
const headKey = new THREE.DirectionalLight(0xbfe0ff, 0); headKey.position.set(3, 6, 5); scene.add(headKey);
// Take-off backlight from the void side: dark wings with hot rims, like the HSR/HotD refs
const backKey = new THREE.DirectionalLight(0xff4fd8, 0); backKey.position.set(0, 6, -6); scene.add(backKey);

// ─── butterflies: burst swarm + rushers past the lens ───────────────────────
const tl = new THREE.TextureLoader();
const bfTex = tl.load("./butterfly.png"); bfTex.colorSpace = THREE.SRGBColorSpace;
const bokehTex = tl.load("./butterfly-bokeh.png"); bokehTex.colorSpace = THREE.SRGBColorSpace;
const TINTS = [new THREE.Color(1.3, 0.6, 2.0), new THREE.Color(2.0, 0.7, 1.6), new THREE.Color(0.6, 1.6, 2.0)];

// Big bokeh butterflies that rush past the lens during the burst
const rushers = Array.from({ length: 5 }, (_, i) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bokehTex, color: TINTS[i % 3], transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  sp.renderOrder = 11; camera.add(sp);
  return { sp, x: (i % 2 ? 1 : -1) * (0.25 + Math.random() * 0.5), y: (Math.random() - 0.5) * 0.7, t0: 3.35 + i * 0.12, rot: Math.random() * 6 };
});
// Swarm bursting out of the tear, stretched along velocity (motion streaks)
const SWARM_N = 80;
const swarm = Array.from({ length: SWARM_N }, (_, i) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bfTex, color: TINTS[i % 3], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
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
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.5, 0.9);
composer.addPass(bloom);
const afterimage = new AfterimagePass(0); composer.addPass(afterimage);
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
      vec2 off = c * uCA * (0.4 + dot(c,c) * 3.0);
      vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      float keep = smoothstep(0.35, 1.3, lum);    // desaturate the world, keep emissive accents saturated
      col = mix(col, vec3(lum) * vec3(0.92, 0.95, 1.08), uDesat * (1.0 - keep));
      col = mix(col, col * vec3(0.9, 0.78, 1.12), 0.45);          // push shadows/mids violet
      col = col * col * (3.0 - 2.0 * min(col, vec3(1.0))) * 0.35 + col * 0.65;  // S-curve contrast
      float v = smoothstep(0.95, 0.2, length(c * vec2(uAspect * 0.7, 1.0)));
      col *= mix(1.0, v, uVignette);
      float g = fract(sin(dot(vUv * vec2(1731.0, 977.0) + uTime, vec2(12.9898, 78.233))) * 43758.5453);
      col += (g - 0.5) * 0.014;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());

// ─── dragon ─────────────────────────────────────────────────────────────────
const rig = new THREE.Group(); scene.add(rig);     // animated by the timeline
const orient = new THREE.Group(); rig.add(orient); // normalizes model facing/scale
const wingU = { uWingGlow: { value: 0 }, uWingR: { value: 1 } };
// Veil: until the dragon emerges, any part of it in front of the rift plane is
// clipped unless it's inside the tear — it can only come *through* the hole.
const veilU = { uVeil: { value: 1 }, uSealed: { value: 1 }, uHalfOpen: riftUniforms.uHalfOpen, uAngle: riftUniforms.uAngle, uLen: riftUniforms.uLen, uTime: riftUniforms.uTime };
function addVeil(sh, overrides) {
  Object.assign(sh.uniforms, veilU, overrides || {});
  sh.vertexShader = "varying vec3 vWorldP;\n" + sh.vertexShader.replace(
    "#include <project_vertex>", "#include <project_vertex>\n vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  sh.fragmentShader = `uniform float uVeil, uSealed, uHalfOpen, uAngle, uLen, uTime; varying vec3 vWorldP;\n${TEAR_GLSL}\n` +
    sh.fragmentShader.replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
      if (uVeil > 0.5 && vWorldP.z > 0.0) {
        if (uSealed > 0.5) discard;              // breach: nothing but the claw crosses the rift
        vec2 r = t_rot(vWorldP.xy / ${TEAR_SPACE}.0 + 0.5, uAngle);
        if (abs(r.x - t_spine(r.y, uTime)) > t_half(r.y, uHalfOpen, uLen)) discard;
      }`);
}
const veinU = { uVein: { value: 0 } };
let mixer, actions = {}, eyeMats = [], eyeMeshes = [], headBone, bones = [];
let breachZ = -2.0;
const wingMats = [];

const draco = new DRACOLoader().setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync("./netherwing_pollux_flap.glb"); // + Blender-authored Flap clip
const model = gltf.scene;
orient.add(model);
model.traverse((o) => {
  if (o.isBone) bones.push(o);
  if (o.isMesh) {
    o.frustumCulled = false;
    const m = o.material;
    if (m.name.includes("Wing")) { patchWing(m); wingMats.push({ m, base: m.color.clone() }); }
    else if (m.name.includes("Body")) patchVeins(m);
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
    Object.assign(sh.uniforms, wingU);
    sh.fragmentShader = "uniform float uWingGlow; uniform float uWingR; varying vec3 vWingP;\n" + sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       float wl = dot(diffuseColor.rgb, vec3(0.299,0.587,0.114));
       float facing = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
       float ramp = smoothstep(0.15, 1.0, length(vWingP.xz) / uWingR);   // membrane edges glow more than the root
       totalEmissiveRadiance += mix(vec3(0.55,0.2,0.9), vec3(1.0,0.35,0.85), ramp) * uWingGlow * (0.2 + wl * 1.2) * (0.35 + facing) * (0.3 + ramp);`);
    sh.vertexShader = "varying vec3 vWingP;\n" + sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\n vWingP = transformed;");
  };
  m.needsUpdate = true;
}
// Red crack veins across the dark body: procedural (the model has no emissive map)
function patchVeins(m) {
  m.onBeforeCompile = (sh) => {
    addVeil(sh);
    Object.assign(sh.uniforms, veinU);
    sh.vertexShader = "varying vec3 vObjPos;\n" + sh.vertexShader.replace(
      "#include <skinning_vertex>", "#include <skinning_vertex>\n vObjPos = transformed;");
    sh.fragmentShader = `uniform float uVein; varying vec3 vObjPos;
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
       totalEmissiveRadiance += vec3(1.0, 0.06, 0.14) * vein * dark * uVein * pulse * 2.4;`);
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
  // How far forward does the claw reach during Skill03? Place the dragon so that
  // front-most non-wing bone pokes ~0.35 through the rift plane (z = 0).
  let maxZ = -Infinity;
  for (let i = 0; i <= 20; i++) {
    setClips([["Skill03", (actions.Skill03.getClip().duration * i) / 20, 1]]); model.updateMatrixWorld(true);
    for (const b of bones) if (!/Wing|Tail|Feather/.test(b.name)) maxZ = Math.max(maxZ, b.getWorldPosition(p).z);
  }
  breachZ = 0.35 - maxZ;
  wingU.uWingR.value = 2.6 / orient.scale.x;
  console.log("breachZ", breachZ.toFixed(2), "claw reach", maxZ.toFixed(2));
}

// Eyes: HDR red spheres on the eye bones, sized in world units
for (const name of ["Eye_L_047", "Eye_R_048"]) {
  const bone = model.getObjectByName(name);
  const ws = bone.getWorldScale(new THREE.Vector3()).x;
  const mat = new THREE.MeshBasicMaterial({ color: 0xe51247, transparent: true });
  mat.onBeforeCompile = (sh) => addVeil(sh);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03 / ws, 16, 12), mat);
  eye.scale.set(1.5, 0.8, 1); eye.renderOrder = 5;
  bone.add(eye); eyeMats.push(mat); eyeMeshes.push(eye);
}

// ─── the timeline (6.3s) ────────────────────────────────────────────────────
const bz = breachZ;
const DX = 0.3;
const eOut2 = (u) => 1 - (1 - u) * (1 - u);
// Bolt axis: straight at the roar camera, shifted just over its left shoulder so the dragon
// fills the frame and punches past the lens instead of flying through it.
const BOLT_START = new THREE.Vector3(0, 0.42, 1.3), BOLT_END = new THREE.Vector3(3.2, 2.3, 9.5);
const BOLT_DIR = BOLT_END.clone().sub(BOLT_START).normalize();
// Camera: [pos xyz, target xyz, fov, headTrack]. The camera never crosses to
// the dragon's left (x >= 0): one continuous take, one side of the axis.
// ONE continuous take (owner: no cuts, no jumps) — spline through these keys.
const CAM = [
  // anticipation + breach: slow push-in on the crack; the dragon faces us behind the fabric
  { t: 0.0, v: [0.3, 0.1, 5.2,   0, 0, -2,     45, 0] },
  { t: 1.4, v: [0.3, 0.05, 4.75, 0, 0, -1.5,   43, 0.15] },
  // emergence: square-on, easing back a touch as it pushes through
  { t: 2.3, v: [0.4, -0.15, 4.7, 0, 0.35, -0.2, 40, 0.4] },
  // glide round to the owner's roar angle, arriving for the roar peak (3.45)
  { t: 2.9, v: [1.3, 0.25, 4.35, 0, 0.7, 0.6,  37, 0.75] },
  { t: 3.4, v: [2.6, 0.49, 4.05, 0, 1, 1,      34, 1] },
  { t: 4.2, v: [2.45, 0.52, 3.8,  0, 1, 1,      32, 1] },
  // bolt: the roar angle holds (aim frozen where the head was — it doesn't chase the dragon) …
  { t: 4.4, v: [2.44, 0.52, 3.78, 0.28, 1.17, 2.65, 32, 0] },
  // … then pans home to the exact opening shot, flat on the rift. The intro ends here.
  { t: 5.4, v: [0.3, 0.1, 5.2,   0, 0, -2,     45, 0] },
];
const DRAGON = [
  { t: 0.0, v: [DX, 0, -2.6, 0] },
  { t: 0.8, v: [DX, 0, -2.3, 0] },
  { t: 1.05, v: [DX, 0, -2.2, 0] },
  { t: 1.3, v: [DX, 0, bz, 0], e: eIn },
  { t: 1.8, v: [DX, 0, bz - 0.1, 0] },
  { t: 2.42, v: [DX, 0, bz - 0.1, 0] },              // holds behind the rift while the tear widens …
  { t: 2.68, v: [0.12, 0.12, 0.55, -0.06], e: eOut2 }, // … then lunges through once it's open — short and weighty
  { t: 3.4, v: [0.05, 0.35, 1.05, -0.08] },           // creeps forward into the roar
  { t: 4.2, v: [0, 0.5, 1.4, -0.05] },
  { t: 4.32, v: [0, 0.42, 1.3, 0.12] },              // coils back for a beat …
  { t: 4.95, v: [BOLT_END.x, BOLT_END.y, BOLT_END.z, 0], e: eIn },   // … and bolts past the lens, accelerating
];
const IMPULSES = [[1.3, 0.1], [2.55, 0.05], [3.45, 0.12], [4.34, 0.06]];

let idleBase = 0;
function clipPlan(t, idleClock) {
  const w03 = eIO(seg(t, 0.7, 0.95)), w02 = eIO(seg(t, 2.36, 2.72)), w22 = eIO(seg(t, 2.8, 3.25));
  const wFl = eIO(seg(t, 4.05, 4.3));                          // Flight takes over for the launch
  const s03 = t < 1.3 ? 0.35 * seg(t, 0.9, 1.3) : 0.35 + 1.9 * eOut(seg(t, 1.3, 1.9));
  const s02 = 0.9 * eOut(seg(t, 2.45, 2.95));
  // Roar: head-thrust / jaw-open peak lands at 3.45, then held
  const s22 = t < 3.45 ? 0.3 + 0.3 * seg(t, 2.95, 3.45) : 0.6 + 0.5 * seg(t, 3.45, 4.2);
  const crown = 0.55 * eIO(seg(t, 2.85, 3.25));                // wings held in the upstroke "crown"
  return [
    ["StandBy", (idleClock + t) % 3.0, 1 - w03],
    ["Skill03", s03, w03 * (1 - w02)],
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
const barTop = document.getElementById("barTop"), barBot = document.getElementById("barBot"), flashEl = document.getElementById("flash");
const spine1 = model.getObjectByName("Spine1_M_016"), neck0 = model.getObjectByName("Neck_M_020");
const _s1 = new THREE.Vector3(), _s2 = new THREE.Vector3();
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
  // Square the body to the rift from frame 0: measure the spine's heading (the claw strike turns
  // it ~43°) and cancel it, so body and face are one straight line. Released as the rift fully
  // opens so the owner's 2.5s pose is untouched.
  const wSquare = 1 - eIO(seg(t, 2.3, 2.5));
  if (wSquare > 0) {
    spine1.getWorldPosition(_s1); neck0.getWorldPosition(_s2);
    rig.rotation.y -= Math.atan2(_s2.x - _s1.x, _s2.z - _s1.z) * wSquare;
    rig.updateMatrixWorld(true);
  }
  // Breach + emergence: the face stays square to the rift, looking straight out at us
  const camNow = smoothTrack(CAM, t);
  headBone.getWorldPosition(_hp); _toCam.set(camNow[0], camNow[1], camNow[2]).sub(_hp).normalize();
  const wAim = 1 - eIO(seg(t, 2.85, 3.2));                      // face straight out from frame 0; hands back to the roar clip
  if (wAim > 0) aimHead(_aimDir.copy(FACE_OUT).lerp(_toCam, 0.7).normalize(), WORLD_UP, wAim);
  if (wb > 0) aimHead(BOLT_DIR, WORLD_UP, 0.85 * wb);            // head leads along the bolt

  // Camera + impact-only shake
  const c = smoothTrack(CAM, t); c[7] = clamp(c[7], 0, 1);
  if (c[7] > 0) { headBone.getWorldPosition(tmp2); c[3] = lerp(c[3], tmp2.x, c[7]); c[4] = lerp(c[4], tmp2.y, c[7]); c[5] = lerp(c[5], tmp2.z, c[7]); }
  let amp = 0; for (const [ti, a] of IMPULSES) amp += a * impulse(t, ti, 8);
  const sx = amp * (Math.sin(t * 83) + 0.5 * Math.sin(t * 47.3)), sy = amp * (Math.cos(t * 71) + 0.5 * Math.sin(t * 59.1));
  const drift = t === 0 ? 1 : 0;
  camera.position.set(c[0] + sx + drift * Math.sin(wall * 0.3) * 0.05, c[1] + sy + drift * Math.sin(wall * 0.23) * 0.03, c[2]);
  const tgt = tmp3.set(c[3] + sx * 0.5, c[4] + sy * 0.5, c[5]);
  if (camera.fov !== c[6]) { camera.fov = c[6]; camera.updateProjectionMatrix(); }
  camera.lookAt(tgt);
  // Rift-only guard: every frustum corner must land on the rift plane (z=0, inside
  // its 120-unit extent). If not, tip the aim back toward the rift until it does.
  // Fine steps: the correction is the minimum needed, so it varies smoothly with t (no pops).
  for (let i = 0; i < 600 && !frustumOnRift(); i++) {
    tgt.z -= 0.02; tgt.y -= 0.007; camera.lookAt(tgt); window.__camGuard = (window.__camGuard || 0) + 1;
  }

  // Rift: narrow tear (shoulder-width) until the wing burst, then it rips wide
  const crackP = t < 1.3 ? 0.28 + 0.4 * seg(t, 0.1, 1.3) + 0.18 * Math.sin(t * 12 + wall * 2) * (0.4 + seg(t, 0.1, 1.3)) : 1;
  const riftP = eIO(seg(t, 1.3, 2.5));
  riftUniforms.uCrackP.value = crackP;
  riftUniforms.uRiftP.value = riftP;
  riftUniforms.uHalfOpen.value = t < 1.3 ? 0 : 0.0006 + eOut(seg(t, 1.3, 1.9)) * 0.022 + eOut(seg(t, 2.35, 2.8)) * 0.09 * (1 - 0.8 * eIO(seg(t, 4.7, 5.5)));   // settles to a readable tear for the final frame
  riftUniforms.uLen.value = t < 1.3 ? 0.02 + 0.03 * seg(t, 0.1, 1.3) : 0.05 + 0.04 * seg(t, 1.3, 1.9) + 0.07 * eOut(seg(t, 2.35, 2.8)) * (1 - 0.3 * eIO(seg(t, 4.7, 5.5)));
  veilU.uVeil.value = t < 2.8 ? 1 : 0;
  veilU.uSealed.value = t < 1.9 ? 1 : 0;                 // body stays behind the rift until it pushes through
  // claws always on: the veil still hides them until the tear opens
  riftUniforms.uAngle.value = (lerp(38, 14, riftP) + Math.sin(riftP * Math.PI) * 3) * Math.PI / 180;
  riftUniforms.uBurstGlow.value = 0.55 * impulse(t, 1.3, 6) + 0.4 * impulse(t, 2.55, 4);
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
  tearLight.intensity = raysI * lerp(6, 14, seg(t, 2.2, 2.6));   // keep the dragon a silhouette in the void early on
  clawLight.intensity = 3 * bell(t, 1.2, 1.9);
  const early = lerp(0.5, 1, seg(t, 2.2, 2.6));                  // dragon stays a silhouette inside the void
  rimLight.intensity = 0.2 + raysI * 1.8 * early;
  pinkBack.intensity = raysI * 1.4 * early;
  headKey.intensity = 0.9 * seg(t, 2.6, 3.0);
  const tk = eIO(seg(t, 4.2, 4.6));
  if (t > 4.2) { headKey.target = rig; headKey.position.copy(camera.position).add(tmp3.set(0.5, 2.5, 0)); headKey.intensity = lerp(1.1, 0.45, tk); }
  backKey.target = rig; backKey.intensity = 3.5 * tk;
  fill.intensity = lerp(0.3, 0.1, tk);
  hemi.intensity = lerp(0.35, 0.12, tk);
  wingMats.forEach((w) => w.m.color.copy(w.base).multiplyScalar(lerp(1, 0.38, tk)));
  haze.forEach((h, i) => { h.material.opacity = 0.07 * seg(t, 1.4, 2.4) * (1 - seg(t, 4.9, 5.5)); h.material.rotation = wall * 0.02 * (i % 2 ? 1 : -1); });

  // Emissive accents
  wingU.uWingGlow.value = 0.06 + eOut(seg(t, 2.5, 2.9)) * 0.35 + 0.3 * tk;
  veinU.uVein.value = t < 2.5 ? 0.15 : 0.5 + 1.5 * Math.exp(-Math.pow((t - 3.45) * 2.5, 2));
  const eyeI = 1 + 2 * Math.exp(-Math.pow((t - 1.3) * 6, 2)) + 2.5 * Math.exp(-Math.pow((t - 3.45) * 5, 2)) + 1.5 * seg(t, 4.2, 4.5);
  eyeMats.forEach((m) => { m.color.setHex(0xe51247).multiplyScalar(6 * eyeI); });

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
    b.sp.material.opacity = Math.min(1, dt * 6) * (1 - u) * seg(near, 0.8, 1.8);   // never smear across the lens
  });

  // Post
  grade.uniforms.uDesat.value = seg(t, 0.1, 0.9) * 0.55 * (1 - seg(t, 4.9, 5.5));
  grade.uniforms.uVignette.value = 0.3 + 0.35 * seg(t, 0.1, 0.9) * (1 - seg(t, 4.9, 5.5));
  grade.uniforms.uCA.value = Math.min(0.008, 0.002 + 0.008 * impulse(t, 1.3, 6) + 0.005 * impulse(t, 2.55, 6) + 0.008 * impulse(t, 3.45, 5) + 0.006 * bell(t, 4.4, 4.95));
  grade.uniforms.uTime.value = wall;
  if (t > 3.4 && t < 4.2) {
    headBone.getWorldPosition(tmp).project(camera);
    grade.uniforms.uShockC.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
    grade.uniforms.uShockR.value = eOut(seg(t, 3.4, 4.15)) * 1.3;
    grade.uniforms.uShockS.value = 0.018 * (1 - seg(t, 3.4, 4.15));
  } else grade.uniforms.uShockS.value = 0;
  const damp = 0.8 * bell(t, 4.35, 5.05);                         // speed smear on the bolt
  afterimage.enabled = damp > 0.02;
  afterimage.uniforms.damp.value = damp;
  bloom.strength = 0.6 + 0.25 * impulse(t, 1.3, 6) + 0.3 * impulse(t, 3.45, 4);

  // DOM: letterbox + flash into the hero palette
  const lb = eIO(seg(t, 0.1, 0.9)) * (1 - eIO(seg(t, 4.9, 5.5)));
  const barH = Math.min(innerHeight * 0.14, Math.max(0, (innerHeight - innerWidth / 2.39) / 2)) * lb;
  barTop.style.height = barBot.style.height = barH + "px";
  flashEl.style.opacity = 0;                                      // no flash: it ends on the opening shot
}

// ─── playback / HUD ─────────────────────────────────────────────────────────
const scrub = document.getElementById("scrub"), timeEl = document.getElementById("time"), shotEl = document.getElementById("shot");
let t = Number(params.get("t") || 0), playing = false, playStart = 0, playFrom = 0;
function play() { if (t >= DURATION - 0.01) t = 0; playing = true; playStart = performance.now(); playFrom = t; idleBase = (performance.now() / 1000) % 3; }
document.getElementById("play").onclick = play;
document.getElementById("idle").onclick = () => { playing = false; t = 0; };
scrub.oninput = () => { playing = false; t = Number(scrub.value); };
addEventListener("keydown", (e) => {
  if (e.key === " ") { e.preventDefault(); playing ? (playing = false) : play(); }
  if (e.key === "ArrowRight") { playing = false; t = Math.min(DURATION, t + 1 / 30); }
  if (e.key === "ArrowLeft") { playing = false; t = Math.max(0, t - 1 / 30); }
});
addEventListener("wheel", (e) => { if (!playing && t === 0 && e.deltaY > 0) play(); }, { passive: true });
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  grade.uniforms.uAspect.value = innerWidth / innerHeight;
});
window.__setT = (x) => { playing = false; t = x; };  // for scripted screenshots
window.__cam = camera;
window.__model = model;
window.__probe = (x) => {                          // head screen position + guard hits at time x
  window.__camGuard = 0; applyTimeline(x, idleBase, 0);
  const h = headBone.getWorldPosition(new THREE.Vector3()), sp = h.clone().project(camera);
  return { t: x, head: h.toArray().map((v) => +v.toFixed(2)), scr: [+sp.x.toFixed(2), +sp.y.toFixed(2)], guard: window.__camGuard };
};

function frame(now) {
  requestAnimationFrame(frame);
  const wall = now / 1000;
  if (playing) { t = playFrom + (now - playStart) / 1000; if (t >= DURATION) { t = DURATION; playing = false; } }
  applyTimeline(t, playing || t > 0 ? idleBase : wall % 3, wall);
  scrub.max = DURATION; scrub.value = t; timeEl.textContent = t.toFixed(2) + "s";
  shotEl.textContent = t === 0 && !playing ? "0 · It waits (idle) — press Play / scroll" : SHOTS.filter((s) => t >= s[0]).pop()[1];
  composer.render();
}
requestAnimationFrame(frame);
window.__ready = true;

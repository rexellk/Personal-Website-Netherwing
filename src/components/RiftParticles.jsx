import { useEffect, useRef } from "react";
import * as THREE from "three";

// ── Tuning knobs ──────────────────────────────────────────────────────────────
const CORE_BRIGHTNESS  = 3.0;   // overbright multiplier for particle core (bloom feel)
const OUTER_BRIGHTNESS = 1.5;   // overbright multiplier for particle outer ring
const CORE_ALPHA       = 0.90;  // max alpha at center
const OUTER_ALPHA      = 0.20;  // max alpha at edge

const SPARK_SIZE_MIN   = 0.2;   // molten spark min size
const SPARK_SIZE_RANGE = 0.25;   // molten spark size variance (max = min + range)
const DUST_SIZE_MIN    = 0.1;   // stardust min size
const DUST_SIZE_RANGE  = 0.3;   // stardust size variance

const SPARK_LIFE_MIN   = 0.009; // molten spark min lifeSpeed (higher = dies faster)
const SPARK_LIFE_RANGE = 0.012;
const DUST_LIFE_MIN    = 0.014; // stardust min lifeSpeed
const DUST_LIFE_RANGE  = 0.022;

const BURST_EARLY      = 4;     // particles per frame when rift is <15% open
const BURST_MID        = 2;     // particles per frame when rift is 15–60% open
const BURST_LATE       = 1;   // particles per frame when rift is >60% open

const PARTICLE_DELAY   = 0.6;   // seconds after CLAW_IMPACT before particles start
// ─────────────────────────────────────────────────────────────────────────────

const VERT = /* glsl */`
attribute float aSize;
attribute float aLife;   // 0 = just born, 1 = dead
attribute vec3  aColor;

varying float vLife;
varying vec3  vColor;

void main() {
  vLife  = aLife;
  vColor = aColor;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position  = projectionMatrix * mv;
  // Size fades out as life approaches 1, varies by aSize
  gl_PointSize = aSize * (1.0 - smoothstep(0.6, 1.0, aLife)) * (300.0 / -mv.z);
}
`;

const FRAG = /* glsl */`
uniform float uCoreBrightness;
uniform float uOuterBrightness;
uniform float uCoreAlpha;
uniform float uOuterAlpha;

varying float vLife;
varying vec3  vColor;

void main() {
  // Circular soft disc
  vec2  uv   = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  // Bright core, soft edge
  float core  = 1.0 - smoothstep(0.0, 0.22, dist);
  float outer = 1.0 - smoothstep(0.22, 0.50, dist);
  float alpha = (core * uCoreAlpha + outer * uOuterAlpha) * (1.0 - smoothstep(0.55, 1.0, vLife));

  // Overbright so additive blending gives a bloom feel
  vec3 col = vColor * (core * uCoreBrightness + outer * uOuterBrightness);

  gl_FragColor = vec4(col, alpha);
}
`;

// ── Palette ───────────────────────────────────────────────────────────────────
const COLORS = [
  new THREE.Color(0x1a00ff),   // deep electric blue
  new THREE.Color(0x3300cc),   // dark blue-purple
  new THREE.Color(0x6600ff),   // vivid purple
  new THREE.Color(0xaa33ff),   // mid purple
  new THREE.Color(0xcc55ff),   // bright lavender
  new THREE.Color(0xeeccff),   // near-white purple (hot spark)
  new THREE.Color(0x2211aa),   // dark indigo
  new THREE.Color(0xff99ff),   // pink-white flare
];

const MAX_PARTICLES = 1800;

export default function RiftParticles() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.background = "transparent";

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
    camera.position.set(0, 0, 10);

    // ── Geometry buffers ────────────────────────────────────────────────────
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors    = new Float32Array(MAX_PARTICLES * 3);
    const sizes     = new Float32Array(MAX_PARTICLES);
    const lives     = new Float32Array(MAX_PARTICLES);  // 0..1

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aColor",   new THREE.BufferAttribute(colors,    3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes,     1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aLife",    new THREE.BufferAttribute(lives,     1).setUsage(THREE.DynamicDrawUsage));

    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uCoreBrightness:  { value: CORE_BRIGHTNESS },
        uOuterBrightness: { value: OUTER_BRIGHTNESS },
        uCoreAlpha:       { value: CORE_ALPHA },
        uOuterAlpha:      { value: OUTER_ALPHA },
      },
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
    });

    scene.add(new THREE.Points(geo, mat));

    // ── Particle pool ────────────────────────────────────────────────────────
    // Each particle: position, velocity, life (0..1), lifeSpeed, size
    const pool = Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      life: 1,         // start dead
      lifeSpeed: 0.01,
      size: 1,
      r: 1, g: 1, b: 1,
      active: false,
    }));

    let deadHead = 0; // simple round-robin index for recycling

    function spawn(count, edgeWorld) {
      for (let i = 0; i < count; i++) {
        // Find a dead particle
        let idx = -1;
        for (let k = 0; k < MAX_PARTICLES; k++) {
          const j = (deadHead + k) % MAX_PARTICLES;
          if (!pool[j].active) { idx = j; deadHead = (j + 1) % MAX_PARTICLES; break; }
        }
        if (idx === -1) return; // pool full

        const p = pool[idx];

        // Pick left or right rift edge
        const side  = Math.random() < 0.5 ? -1 : 1;
        const edgeX = side * edgeWorld;

        p.x = edgeX + (Math.random() - 0.5) * 0.15;
        p.y = (Math.random() - 0.5) * 6.0;
        p.z = (Math.random() - 0.5) * 0.5;

        // Velocity — blast outward from rift edge + slight upward drift
        const speed  = 0.04 + Math.random() * 0.18;
        p.vx = side * speed * (0.5 + Math.random() * 0.8);
        p.vy = (Math.random() - 0.5) * speed * 0.6 + 0.015 + Math.random() * 0.02;
        p.vz = (Math.random() - 0.5) * 0.02;

        // Two types: fast stardust vs slower molten spark
        const isSpark = Math.random() < 0.35;
        p.size      = isSpark
          ? SPARK_SIZE_MIN  + Math.random() * SPARK_SIZE_RANGE
          : DUST_SIZE_MIN   + Math.random() * DUST_SIZE_RANGE;
        p.lifeSpeed = isSpark
          ? SPARK_LIFE_MIN  + Math.random() * SPARK_LIFE_RANGE
          : DUST_LIFE_MIN   + Math.random() * DUST_LIFE_RANGE;

        const col = COLORS[Math.floor(Math.random() * COLORS.length)];
        p.r = col.r; p.g = col.g; p.b = col.b;

        p.life   = 0;
        p.active = true;
      }
    }

    // ── Sync helpers ─────────────────────────────────────────────────────────
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const ph    = (t, s, e)   => clamp((t - s) / (e - s), 0, 1);
    const eIO   = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
    const eOut  = (t) => 1 - Math.pow(1 - t, 3);

    const CLAW_IMPACT = 1.2;
    const CLAW_FINISH = 2.8;

    // Camera FOV=60, z=10 → half-width at z=0 = tan(30°)*10*aspect
    // edgeX_world = (halfOpen_px / W) * 2 * halfWorldWidth
    const CAM_Z      = 10;
    const HALF_ANGLE = Math.PI / 6; // 30° = half of 60° FOV

    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    let lastDragonTime = -1;
    let frameId;

    function frame() {
      frameId = requestAnimationFrame(frame);

      let dragonTime = window.riftFrozenTime ?? 0;
      if (!window.riftFrozenTime && window.primaryDragonAction && !window.primaryDragonAction.paused) {
        dragonTime = window.primaryDragonAction.time;
      }

      const crackP = eIO(ph(dragonTime, CLAW_IMPACT, CLAW_IMPACT + 0.4));
      const riftP  = eIO(ph(dragonTime, CLAW_IMPACT + 0.2, CLAW_FINISH));
      const openP  = crackP * 0.04 + eOut(riftP) * 0.96;

      // Convert rift half-open pixels → world-space X
      const maxHalfPx   = Math.max(1, Math.min(W * 0.4, 400));
      const halfOpenPx  = openP * maxHalfPx * 1.4; // match uRiftScale=1.4
      const halfWorldW  = Math.tan(HALF_ANGLE) * CAM_Z * (W / H);
      const edgeWorld   = (halfOpenPx / W) * 2.0 * halfWorldW;

      // Only emit while rift is actively opening
      const isOpening = dragonTime > CLAW_IMPACT + PARTICLE_DELAY && dragonTime < CLAW_FINISH + 0.5;
      if (isOpening && dragonTime !== lastDragonTime) {
        const burstRate = openP < 0.15 ? BURST_EARLY : openP < 0.6 ? BURST_MID : BURST_LATE;
        spawn(burstRate, edgeWorld);
      }
      lastDragonTime = dragonTime;

      // ── Update particles ─────────────────────────────────────────────────
      const posArr  = geo.attributes.position.array;
      const colArr  = geo.attributes.aColor.array;
      const sizeArr = geo.attributes.aSize.array;
      const lifeArr = geo.attributes.aLife.array;

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = pool[i];
        if (!p.active) {
          lifeArr[i] = 1; sizeArr[i] = 0;
          continue;
        }

        // Gravity + drag
        p.vy -= 0.0008;
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life += p.lifeSpeed;

        if (p.life >= 1) { p.active = false; p.life = 1; }

        const i3 = i * 3;
        posArr[i3]     = p.x;
        posArr[i3 + 1] = p.y;
        posArr[i3 + 2] = p.z;
        colArr[i3]     = p.r;
        colArr[i3 + 1] = p.g;
        colArr[i3 + 2] = p.b;
        sizeArr[i]     = p.size;
        lifeArr[i]     = p.life;
      }

      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate   = true;
      geo.attributes.aSize.needsUpdate    = true;
      geo.attributes.aLife.needsUpdate    = true;

      // Apply shake
      camera.position.x = (window.shakeOffset?.x || 0) * 0.08;
      camera.position.y = (window.shakeOffset?.y || 0) * 0.08;

      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 18,      // above rift (9) and vignette (12), below claw (20)
        pointerEvents: "none",
      }}
    />
  );
}

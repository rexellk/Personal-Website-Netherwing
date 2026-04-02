import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */`
varying vec2 vUv;
uniform float uTime;
uniform float uRiftP;
uniform float uCrackP;
uniform float uAngle;
uniform float uHalfOpen;
uniform float uAspect;
uniform float uBurstGlow;
uniform float uRiftScale;
uniform vec2  uShake;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),            hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p  = m * p * 2.1;
    a *= 0.5;
  }
  return v;
}

vec2 rotUV(vec2 uv, float a) {
  vec2 c = uv - 0.5;
  return vec2(cos(a)*c.x - sin(a)*c.y,
              sin(a)*c.x + cos(a)*c.y) + 0.5;
}

void main() {
  vec2 uv  = vUv + uShake;
  vec2 ruv = rotUV(uv, uAngle);
  vec2 raUv = vec2(ruv.x * uAspect, ruv.y);

  // Sine-wave tear spine (same freq as original)
  float y     = ruv.y;
  float spine = 0.5
    + sin(y * 31.4  + uTime * 3.5) * 0.013
    + sin(y * 78.5  - uTime * 2.0) * 0.008
    + sin(y * 146.1 + uTime * 5.0) * 0.005;

  float dist = abs(ruv.x - spine);

  float scaledHalf = uHalfOpen * uRiftScale;

  // Void — fully transparent so dragon behind shows through
  if (scaledHalf > 0.0005 && dist < scaledHalf) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // Fabric noise — woven cloth look
  float weave = fbm(raUv * 24.0 + vec2(uTime * 0.06, uTime * 0.04));
  float cross = fbm(vec2(raUv.y * 1.1, raUv.x * 0.9) * 20.0 - uTime * 0.05);
  float cloth = weave * 0.55 + cross * 0.45;
  cloth += (
    sin(ruv.x * 9.0  + uTime * 1.0) * 0.035 +
    sin(ruv.y * 7.0  - uTime * 0.7) * 0.025
  ) * 0.25;
  cloth = clamp(cloth, 0.0, 1.0);

  // Very dark fabric — near black with faint purple tint
  vec3 cBlack = vec3(0.0,  0.0,  0.0);
  vec3 cDark  = vec3(0.05, 0.01, 0.10);
  vec3 col    = mix(cBlack, cDark, cloth * 0.7);

  // Multi-layer fake bloom on the rift edge
  if (scaledHalf > 0.0005) {
    float edgeDist  = dist - scaledHalf;
    float shimmer   = 0.7 + 0.3 * sin(y * 100.0 + uTime * 4.5);
    float burstMult = 1.0 + uBurstGlow * 3.5;

    // Layer 1 — tight bright core (sharp inner lip)
    float core = exp(-edgeDist * 180.0) * uRiftP * shimmer * burstMult;
    // Layer 2 — medium spread (main glow body)
    float mid  = exp(-edgeDist *  55.0) * uRiftP * shimmer * burstMult * 0.65;
    // Layer 3 — wide soft halo (bleeds into fabric)
    float halo = exp(-edgeDist *  14.0) * uRiftP * 0.30 * burstMult;

    // Core: near-white hot purple
    vec3 cCore = mix(vec3(0.75, 0.30, 1.00), vec3(1.00, 0.92, 1.00), core);
    cCore = mix(cCore, vec3(1.0, 0.95, 1.0), uBurstGlow * 0.9);

    // Mid: saturated purple
    vec3 cMid  = vec3(0.50, 0.08, 0.95);

    // Halo: deep blue-purple bleed
    vec3 cHalo = vec3(0.18, 0.02, 0.40);

    col += cCore * core * (2.8 + uBurstGlow * 4.5);
    col += cMid  * mid  * 1.8;
    col += cHalo * halo * 1.2;
    col  = clamp(col, 0.0, 2.5);
  }

  // Hairline crack before full tear
  if (uCrackP > 0.0 && scaledHalf < 0.004) {
    float crack = exp(-dist * 1400.0) * uCrackP;
    col += vec3(0.80, 0.45, 1.0) * crack * (4.0 + uBurstGlow * 8.0);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function RiftCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.background = "transparent";

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime:     { value: 0 },
      uRiftP:    { value: 0 },
      uCrackP:   { value: 0 },
      uAngle:    { value: 40 * Math.PI / 180 },
      uHalfOpen:  { value: 0 },
      uAspect:    { value: W / H },
      uBurstGlow:  { value: 0 },
      uRiftScale:  { value: 1.4 }, // ← < 1.0 = narrower opening, > 1.0 = wider
      uShake:      { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite:  false,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    window.riftTimingRef = {
      crackStart: 1.2, crackEnd: 2.4, riftStart: 2.2, riftEnd: 5.8,
    };

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const ph    = (t, s, e)   => clamp((t - s) / (e - s), 0, 1);
    const lerp  = (a, b, t)   => a + (b - a) * t;
    const eOut  = (t) => 1 - Math.pow(1 - t, 3);
    const eIO   = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H);
      uniforms.uAspect.value = W / H;
    }
    window.addEventListener("resize", onResize);

    const CYCLE = 17;
    let t0 = null, frameId;

    function frame(ts) {
      frameId = requestAnimationFrame(frame);
      if (!t0) t0 = ts;
      const t = ((ts - t0) / 1000) % CYCLE;

      uniforms.uTime.value = t;

      // Once frozen (flash fired), hold rift fully open forever
      let dragonTime = window.riftFrozenTime ?? 0;
      if (!window.riftFrozenTime && window.primaryDragonAction && !window.primaryDragonAction.paused) {
        dragonTime = window.primaryDragonAction.time;
      }

      const CLAW_IMPACT = 1.2, CLAW_FINISH = 2.8;
      const crackP   = eIO(ph(dragonTime, CLAW_IMPACT, CLAW_IMPACT + 0.4));
      const riftP    = eIO(ph(dragonTime, CLAW_IMPACT + 0.2, CLAW_FINISH));
      const maxHalf  = Math.max(1, Math.min(W * 0.4, 400));
      const halfOpen = (crackP * 0.04 + eOut(riftP) * 0.96) * maxHalf;

      // Burst peaks right as crack starts, decays once rift is fully open
      const burstGlow = crackP * Math.pow(1.0 - riftP, 1.5);
      uniforms.uBurstGlow.value = burstGlow;
      uniforms.uRiftP.value    = riftP;
      uniforms.uCrackP.value   = crackP;
      uniforms.uHalfOpen.value = halfOpen / W;

      const angleDeg = lerp(40, 10, riftP) + Math.sin(riftP * Math.PI) * 3;
      uniforms.uAngle.value = angleDeg * Math.PI / 180;

      uniforms.uShake.value.set(
        (window.shakeOffset?.x || 0) * 0.008,
        (window.shakeOffset?.y || 0) * 0.008,
      );

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
        zIndex: 9,
        pointerEvents: "none",
      }}
    />
  );
}

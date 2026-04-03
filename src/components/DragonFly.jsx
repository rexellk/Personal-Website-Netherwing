import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Timer } from "three";
import { loadNetherwingGLTF } from "./loadNetherwingGLTF";
import gsap from "gsap";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

// ── Tuning ────────────────────────────────────────────────────────────────────
const ANIM_SPEED   = 0.5;   // animation playback speed (1.0 = normal)
const FLY_START_X  = -10;    // world X where dragon enters
const FLY_END_X    =  8;    // world X where dragon exits
const FLY_Y        = 0.0;   // starting vertical position
const FLY_DURATION = 2.0;   // seconds to cross the screen
const DIVE_Y_SPEED = 2.0;   // world units per second downward drift
const DIVE_Y_MAX   = 10.0;  // max total downward shift
const BANK_SPEED   = 1.3;   // radians per second Z rotation (banking turn)
const BANK_OFFSET  = -0.4;  // starting Z rotation offset in radians

// ── Trail tuning ──────────────────────────────────────────────────────────────
const TRAIL_COUNT      = 500;   // max simultaneous trail particles
const TRAIL_SPAWN_RATE = 1.0;     // particles spawned per frame while flying
const TRAIL_LIFE_SPEED = 0.01; // how fast particles die (higher = shorter trail)
const TRAIL_SPREAD     = 1.6;   // random spawn scatter radius around dragon
const TRAIL_DRIFT_X    = -0.06; // X drift per frame (negative = drift left, behind dragon)
const TRAIL_DRIFT_Y    = 0.01;  // slight upward float
const TRAIL_SIZE       = 0.4;  // sprite scale in world units
// HDR values (>1.0) override the sprite's baked-in purple tint via additive blending
const TRAIL_COLORS = [
  new THREE.Color(2.5, 0.8, 5.0),  // lavender-white (0xd2bcf0 pushed bright)
  new THREE.Color(3.5, 0.5, 6.0),  // deep violet (0xcf96f8 pushed bright)
  new THREE.Color(0.5, 5.0, 5.5),  // cyan-teal (0xbafdfc pushed bright)
];
const TRAIL_BRIGHTNESS = 1.0;  // color multiplier fed into AdditiveBlending
const GLOW_SIZE_MULT   = 1.001;   // glow disc size relative to TRAIL_SIZE
const GLOW_BRIGHTNESS  = 1.01;   // glow disc color multiplier

// ── Dragon shading lights ─────────────────────────────────────────────────────
const BELLY_LIGHT_COLOR     = 0x110022;  // near-black dark purple — underside shadow
const BELLY_LIGHT_INTENSITY = 8;         // how strong the belly shadow fill is
const BELLY_LIGHT_OFFSET_Y  = -2.0;     // units below dragon center
const DORSAL_LIGHT_COLOR    = 0x7708a1;  // bright purple — dorsal highlight
const DORSAL_LIGHT_INTENSITY = 3;        // dorsal highlight strength
const DORSAL_LIGHT_OFFSET_Y  =  1.5;    // units above dragon center
// ─────────────────────────────────────────────────────────────────────────────

export default function DragonFly() {
  const mountRef = useRef(null);
  const mixerRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.background = "transparent";

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const menaceLight = new THREE.DirectionalLight(0x6600cc, 3);
    menaceLight.position.set(0, -5, 5);
    scene.add(menaceLight);
    const rimLight = new THREE.DirectionalLight(0xcc33ff, 3);
    rimLight.position.set(-3, 4, -2);
    scene.add(rimLight);

    // Co-moving lights that track the dragon and respond to its banking roll
    const bellyLight = new THREE.PointLight(BELLY_LIGHT_COLOR, BELLY_LIGHT_INTENSITY, 8);
    scene.add(bellyLight);
    const dorsalLight = new THREE.PointLight(DORSAL_LIGHT_COLOR, DORSAL_LIGHT_INTENSITY, 8);
    scene.add(dorsalLight);

    // ── Trail system ──────────────────────────────────────────────────────────
    const dummy = new THREE.Object3D();

    // Pool: each entry tracks position, velocity, life, and color index
    const trailPool = Array.from({ length: TRAIL_COUNT }, () => ({
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0,
      life: 1,      // 0 = just born, 1 = dead
      active: false,
      colorIdx: 0,  // index into TRAIL_COLORS
    }));
    let trailHead = 0;

    // Create the mesh immediately with no texture so it's ready before the dragon flies
    const trailMat = new THREE.MeshBasicMaterial({
      transparent: true,
      color: new THREE.Color(TRAIL_BRIGHTNESS, TRAIL_BRIGHTNESS, TRAIL_BRIGHTNESS), // white * brightness; instanceColor tints per-particle
      vertexColors: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.01,
    });
    const trailGeo = new THREE.PlaneGeometry(TRAIL_SIZE, TRAIL_SIZE);
    const trailMesh = new THREE.InstancedMesh(trailGeo, trailMat, TRAIL_COUNT);
    trailMesh.frustumCulled = false;
    scene.add(trailMesh);
    for (let i = 0; i < TRAIL_COUNT; i++) {
      dummy.position.set(9999, 9999, 9999);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      trailMesh.setMatrixAt(i, dummy.matrix);
    }
    trailMesh.instanceMatrix.needsUpdate = true;

    // Swap texture in as soon as it loads — no visual stall
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("/Butterfly_Sprite.png", (texture) => {
      texture.minFilter = THREE.LinearFilter;
      trailMat.map = texture;
      trailMat.needsUpdate = true;
    });

    // ── Glow disc mesh (radial gradient, rendered behind each butterfly) ───────
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 128; glowCanvas.height = 128;
    const glowCtx = glowCanvas.getContext("2d");
    const glowGrad = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glowGrad.addColorStop(0,    "rgba(255, 255, 255, 1.0)");
    glowGrad.addColorStop(0.35, "rgba(229,  18, 71, 0.6)");
    glowGrad.addColorStop(1,    "rgba(80,    0, 180, 0.0)");
    glowCtx.fillStyle = glowGrad;
    glowCtx.fillRect(0, 0, 128, 128);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: new THREE.Color(GLOW_BRIGHTNESS, GLOW_BRIGHTNESS, GLOW_BRIGHTNESS), // instanceColor tints per-particle
    });
    const glowSize = TRAIL_SIZE * GLOW_SIZE_MULT;
    const glowGeo  = new THREE.PlaneGeometry(glowSize, glowSize);
    const glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, TRAIL_COUNT);
    glowMesh.frustumCulled = false;
    scene.add(glowMesh);
    for (let i = 0; i < TRAIL_COUNT; i++) {
      dummy.position.set(9999, 9999, 9999);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      glowMesh.setMatrixAt(i, dummy.matrix);
    }
    glowMesh.instanceMatrix.needsUpdate = true;
    // ─────────────────────────────────────────────────────────────────────────

    function spawnTrailAt(ox, oy, oz) {
      let idx = -1;
      for (let k = 0; k < TRAIL_COUNT; k++) {
        const j = (trailHead + k) % TRAIL_COUNT;
        if (!trailPool[j].active) { idx = j; trailHead = (j + 1) % TRAIL_COUNT; break; }
      }
      if (idx === -1) return;

      const p = trailPool[idx];
      p.x = ox + (Math.random() - 0.5) * TRAIL_SPREAD;
      p.y = oy + (Math.random() - 0.5) * TRAIL_SPREAD;
      p.z = oz + (Math.random() - 0.5) * TRAIL_SPREAD * 0.5;
      p.vx = TRAIL_DRIFT_X + (Math.random() - 0.5) * 0.02;
      p.vy = TRAIL_DRIFT_Y + (Math.random() - 0.5) * 0.02;
      p.life = 0;
      p.active = true;
      p.colorIdx = Math.floor(Math.random() * TRAIL_COLORS.length);
    }

    function spawnTrail(ox, oy, oz) {
      for (let s = 0; s < TRAIL_SPAWN_RATE; s++) spawnTrailAt(ox, oy, oz);
    }

    // ── State ─────────────────────────────────────────────────────────────────
    let dragonRef = null;
    let trailBones = []; // all skeleton bones — sampled for trail spawn points
    const _boneWorldPos = new THREE.Vector3();

    // ── Model load ────────────────────────────────────────────────────────────
    loadNetherwingGLTF().then((gltf) => {
      const dragon = gltf.scene;
      dragon.scale.set(2, 2, 2);
      dragon.position.set(FLY_START_X, FLY_Y, 0);
      dragon.rotation.y = Math.PI / 2; // facing right
      scene.add(dragon);

      dragonRef = dragon;
      dragon.traverse((child) => {
        if (child.name === "Object_12") child.visible = false;
        if (child.isBone) trailBones.push(child);
      });

      const mixer = new THREE.AnimationMixer(dragon);
      const roarAction = mixer.clipAction(
        THREE.AnimationClip.findByName(gltf.animations, "Servant_CastoriceServant_00_Ani_Skill22")
      );
      roarAction.setLoop(THREE.LoopOnce);
      roarAction.clampWhenFinished = true;
      roarAction.paused = true;
      mixerRef.current = mixer;
      dragon.visible = false;

      const roarTl = gsap.timeline({ paused: true });

      mixer.addEventListener('finished', (e) => {
        if (e.action !== roarAction) return;
        if (roarAction.timeScale > 0) {
          roarAction.time = roarAction.getClip().duration;
          roarAction.paused = false;
          roarAction.timeScale = -ANIM_SPEED;
          roarAction.play();
        } else {
          roarAction.paused = true;
        }
      });

      roarTl
        .to({}, {
          duration: 0.01,
          onStart: () => {
            dragon.visible = true;
            roarAction.reset().play();
            roarAction.paused = false;
            roarAction.timeScale = ANIM_SPEED;
          }
        })
        .to(dragon.position, { x: FLY_END_X, duration: FLY_DURATION, ease: "none" }, 0)
        .to(camera.position, { z: 3.5, duration: 1.0, ease: "power2.inOut" }, 0);

      window.startDragonRoar = () => {
        flyTime = 0;
        roarAction.timeScale = ANIM_SPEED;
        dragon.position.set(FLY_START_X, FLY_Y, 0);
        dragon.rotation.y = Math.PI / 2;
        dragon.rotation.z = BANK_OFFSET;
        roarTl.restart();
      };

      window.hideDragonRoar = () => {
        dragon.visible = false;
      };

      window.dispatchEvent(new CustomEvent('dragonRoarReady'));
    });

    // ── Animate loop ──────────────────────────────────────────────────────────
    const timer = new Timer();
    let flyTime = 0;

    function animate() {
      requestAnimationFrame(animate);
      timer.update();
      const delta = timer.getDelta();
      const now = performance.now() * 0.001;

      if (mixerRef.current) mixerRef.current.update(delta);

      // Dive + banking rotation
      if (dragonRef && dragonRef.visible) {
        flyTime += delta;
        const diveY = Math.min(flyTime * DIVE_Y_SPEED, DIVE_Y_MAX);
        dragonRef.position.y = FLY_Y - diveY;
        dragonRef.rotation.z = BANK_OFFSET + flyTime * BANK_SPEED;

        // Track dragon with co-moving shading lights
        bellyLight.position.set(dragonRef.position.x, dragonRef.position.y + BELLY_LIGHT_OFFSET_Y, dragonRef.position.z + 1);
        dorsalLight.position.set(dragonRef.position.x, dragonRef.position.y + DORSAL_LIGHT_OFFSET_Y, dragonRef.position.z + 1);

        // Spawn trail from random bones across the full skeleton
        if (trailBones.length > 0) {
          for (let s = 0; s < TRAIL_SPAWN_RATE; s++) {
            const bone = trailBones[Math.floor(Math.random() * trailBones.length)];
            bone.getWorldPosition(_boneWorldPos);
            spawnTrailAt(_boneWorldPos.x, _boneWorldPos.y, _boneWorldPos.z);
          }
        } else {
          spawnTrail(dragonRef.position.x, dragonRef.position.y, dragonRef.position.z);
        }
      }

      // Update trail particles
      if (trailMesh) {
        for (let i = 0; i < TRAIL_COUNT; i++) {
          const p = trailPool[i];
          if (!p.active) {
            dummy.position.set(9999, 9999, 9999);
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            trailMesh.setMatrixAt(i, dummy.matrix);
            glowMesh.setMatrixAt(i, dummy.matrix);
            continue;
          }

          p.x  += p.vx;
          p.y  += p.vy;
          p.life += TRAIL_LIFE_SPEED;
          if (p.life >= 1) { p.active = false; continue; }

          // Fade + shrink as life increases
          const fade = 1.0 - p.life;
          const scale = TRAIL_SIZE * fade;

          const col = TRAIL_COLORS[p.colorIdx];

          dummy.position.set(p.x, p.y, p.z);
          // Slow wing-flap rotation on each sprite
          dummy.rotation.set(0.3, now * 0.6 + i * 0.4, Math.sin(now * 8 + i) * 0.3);
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          trailMesh.setMatrixAt(i, dummy.matrix);
          trailMesh.setColorAt(i, col);

          // Glow disc — same position, no rotation, slightly larger scale
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(scale * GLOW_SIZE_MULT);
          dummy.updateMatrix();
          glowMesh.setMatrixAt(i, dummy.matrix);
          glowMesh.setColorAt(i, col);
        }
        trailMesh.instanceMatrix.needsUpdate = true;
        glowMesh.instanceMatrix.needsUpdate = true;
        if (trailMesh.instanceColor) trailMesh.instanceColor.needsUpdate = true;
        if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
      }

      composer.render();
    }
    animate();

    return () => {
      el.removeChild(renderer.domElement);
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
        zIndex: 2,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}

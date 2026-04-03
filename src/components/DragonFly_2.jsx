import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Timer } from "three";
import { loadNetherwingGLTF } from "./loadNetherwingGLTF";
import gsap from "gsap";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

// ── Tuning ────────────────────────────────────────────────────────────────────
const BLUR_AMOUNT  = 3;     // CSS blur in pixels (0 = sharp, higher = blurrier)
const ANIM_SPEED   = 0.4;   // animation playback speed (1.0 = normal)
const FLY_START_X  =  8;    // world X where dragon enters (right side)
const FLY_END_X    = -15;    // world X where dragon exits (left side)
const FLY_Y        = 3.0;   // starting vertical position
const FLY_DURATION = 0.8;   // seconds to cross the screen
const DIVE_Y_SPEED = 0.1;   // world units per second downward drift
const DIVE_Y_MAX   = 10.0;  // max total downward shift
const BANK_SPEED   = 0.05;   // radians per second Z rotation (banking turn)
// ─────────────────────────────────────────────────────────────────────────────

export default function DragonFly_2() {
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
    renderer.domElement.style.filter = `blur(${BLUR_AMOUNT}px)`;

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

    // ── State ─────────────────────────────────────────────────────────────────
    let dragonRef = null;

    // ── Model load ────────────────────────────────────────────────────────────
    loadNetherwingGLTF().then((gltf) => {
      const dragon = gltf.scene;
      dragon.scale.set(2, 2, 2);
      dragon.position.set(FLY_START_X, FLY_Y, 0);
      dragon.rotation.y = -Math.PI / 2; // facing left
      scene.add(dragon);

      dragonRef = dragon;
      dragon.traverse((child) => {
        if (child.name === "Object_12") child.visible = false;
      });

      const mixer = new THREE.AnimationMixer(dragon);
      const roarAction = mixer.clipAction(
        THREE.AnimationClip.findByName(gltf.animations, "Servant_CastoriceServant_00_Ani_Skill03")
      );
      roarAction.setLoop(THREE.LoopOnce);
      roarAction.clampWhenFinished = true;
      roarAction.paused = true;
      mixerRef.current = mixer;
      dragon.visible = false;

      const flyTl = gsap.timeline({ paused: true });

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

      flyTl
        .to({}, {
          duration: 0.01,
          onStart: () => {
            dragon.visible = true;
            roarAction.reset().play();
            roarAction.paused = false;
            roarAction.timeScale = ANIM_SPEED;
          }
        })
        .to(dragon.position, { x: FLY_END_X, duration: FLY_DURATION, ease: "power2.out" }, 0)
        .to(camera.position, { z: 3.5, duration: 1.0, ease: "power2.inOut" }, 0);

      let fly2HasRun = false;
      window.startDragonFly2 = () => {
        if (fly2HasRun) return;
        fly2HasRun = true;
        flyTime = 0;
        roarAction.timeScale = ANIM_SPEED;
        dragon.position.set(FLY_START_X, FLY_Y, 0);
        dragon.rotation.y = -Math.PI / 2;
        dragon.rotation.z = 0;
        flyTl.restart();
      };

      window.hideDragonFly2 = () => {
        dragon.visible = false;
      };

      window.dispatchEvent(new CustomEvent('dragonFly2Ready'));
    });

    // ── Animate loop ──────────────────────────────────────────────────────────
    const timer = new Timer();
    let flyTime = 0;

    function animate() {
      requestAnimationFrame(animate);
      timer.update();
      const delta = timer.getDelta();

      if (mixerRef.current) mixerRef.current.update(delta);

      // Dive + banking rotation (bank negated for right-to-left direction)
      if (dragonRef && dragonRef.visible) {
        flyTime += delta;
        const diveY = Math.min(flyTime * DIVE_Y_SPEED, DIVE_Y_MAX);
        dragonRef.position.y = FLY_Y - diveY;
        dragonRef.rotation.z = -flyTime * BANK_SPEED;
      }

      composer.render();
    }
    animate();

    return () => {
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
        zIndex: 20,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}

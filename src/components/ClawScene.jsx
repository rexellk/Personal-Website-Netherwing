import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Timer } from "three";
import { loadNetherwingGLTF } from "./loadNetherwingGLTF";

export default function ClawScene() {
  const mountRef = useRef(null);
  const mixerRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.background = "transparent";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xbb88ff, 3);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x4400ff, 2);
    rimLight.position.set(-3, 0, -2);
    scene.add(rimLight);

    // Rift light: purple point light behind claws to simulate rift glow
    const riftLight = new THREE.PointLight(0xcc33ff, 25, 50);
    riftLight.position.set(0, 0, -3);
    scene.add(riftLight);



    const clawMeshes = [];

    loadNetherwingGLTF().then((gltf) => {
      const dragon = gltf.scene;
      dragon.scale.set(35, 35, 35);
      dragon.position.set(0, -6, -5);

      // Hide everything except Object_12 (the claw)
      // Start claw fully transparent — fade in as rift opens
      dragon.traverse((child) => {
        if (child.isMesh) {
          child.visible = child.name === "Object_12";
          if (child.name === "Object_12") {
            // Normalise to single material regardless of whether it's an array
            const src = Array.isArray(child.material) ? child.material[0] : child.material;
            const mat = src.clone();
            mat.transparent = true;
            mat.opacity = 0;
            mat.needsUpdate = true;
            child.material = mat;
            clawMeshes.push(child);
          }
        }
      });

      scene.add(dragon);

      const mixer = new THREE.AnimationMixer(dragon);
      const riftAction = mixer.clipAction(
        THREE.AnimationClip.findByName(
          gltf.animations,
          "Servant_CastoriceServant_00_Ani_Skill03",
        ),
      );

      riftAction.setLoop(THREE.LoopOnce);
      riftAction.clampWhenFinished = true;

      riftAction.play();

      mixerRef.current = mixer;
      actionRef.current = riftAction;
    });

    const timer = new Timer();

    function animate() {
      requestAnimationFrame(animate);

      timer.update();
      const delta = timer.getDelta();

      if (mixerRef.current && actionRef.current && window.primaryDragonAction) {
        // Sync both time AND timeScale from DragonScene
        actionRef.current.time = window.primaryDragonAction.time;
        actionRef.current.timeScale = window.primaryDragonAction.timeScale;
        mixerRef.current.update(0);

        // Fade claw in as rift cracks open (CLAW_IMPACT=1.2 → fully visible by 1.8)
        const t = window.primaryDragonAction.time;
        const FADE_START = 1.0;
        const FADE_END   = 1.8;
        const opacity = Math.min(1, Math.max(0, (t - FADE_START) / (FADE_END - FADE_START)));
        for (const m of clawMeshes) m.material.opacity = opacity;
      } else if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Apply global shake offset to camera
      if (window.shakeOffset) {
        camera.position.x = 0 + window.shakeOffset.x;
        camera.position.y = 0 + window.shakeOffset.y;
      } else {
        camera.position.x = 0;
        camera.position.y = 0;
      }

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 20,
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}

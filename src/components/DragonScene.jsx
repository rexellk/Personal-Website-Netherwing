import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Timer } from "three";
import gsap from "gsap";

export default function DragonScene() {
  const mountRef = useRef(null);
  const mixerRef = useRef(null);

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

    const loader = new GLTFLoader();
    loader.load("/netherwing_pollux.glb", (gltf) => {
      const dragon = gltf.scene;
      dragon.scale.set(30, 30, 30);
      dragon.position.set(0, -5, -5);
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

      // 1. Anticipation (Keep this very slow to make 1.0 feel "fast" by comparison)
      riftAction.timeScale = 0.15; // Dropped from 0.2 to 0.15
      riftAction.play();

      // Expose for ClawScene sync
      window.primaryDragonAction = riftAction;

      const tl = gsap.timeline();

      // 2. The "Impact" (Now Normal Speed)
      tl.to(riftAction, {
        timeScale: 1.0, // Normal speed
        duration: 0.5, // Increased duration to let the animation play out
        delay: 0.8,
        ease: "power2.inOut",
      })
        // 3. The Settle
        .to(riftAction, {
          timeScale: 0.1, // Slow-mo finish
          duration: 1.5,
          ease: "power1.out",
        });

      // Shift rift timing to align with dragon impact
      // Rift crack should start at ~0.8s (when dragon impact occurs)
      // Rift opening should align with the claw strike
      window.riftTimeOffset = 0.8 - 1.2; // Shift to start crack at impact moment

      // 4. Camera Shake (Sync'd to the 0.8s mark)
      // Expose shake globally for all scenes
      window.shakeOffset = { x: 0, y: 0 };

      tl.to(
        camera.position,
        {
          duration: 2.5,
          x: "+=0.0",
          y: "+=0.0",
          modifiers: {
            x: (_) => {
              const time = tl.progress();
              const decay = 1 - time;
              const shakeX = (Math.random() - 0.5) * 0.5 * decay;
              window.shakeOffset.x = shakeX; // Store for other scenes
              return 0 + shakeX;
            },
            y: (_) => {
              const time = tl.progress();
              const decay = 1 - time;
              const shakeY = (Math.random() - 0.5) * 0.5 * decay;
              window.shakeOffset.y = shakeY; // Store for other scenes
              return 0 + shakeY;
            },
          },
          ease: "power2.out",
          onComplete: () => {
            camera.position.set(0, 0, 5);
            window.shakeOffset = { x: 0, y: 0 };
          },
        },
        2.0,
      );

      mixerRef.current = mixer;
    });

    // const clock = new THREE.Clock()
    const timer = new Timer();

    function animate() {
      requestAnimationFrame(animate);

      // Update the timer with the current performance time
      timer.update();
      const delta = timer.getDelta();

      if (mixerRef.current) {
        // Dynamically adjust timescale for impact here if desired
        mixerRef.current.update(delta);
      }

      renderer.render(scene, camera);
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
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1, // ← behind rift
        pointerEvents: "none",
        background: "transparent",
      }}
    />
  );
}

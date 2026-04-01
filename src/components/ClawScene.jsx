import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Timer } from "three";
import gsap from "gsap";

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

    const loader = new GLTFLoader();
    loader.load("/netherwing_pollux.glb", (gltf) => {
      const dragon = gltf.scene;
      dragon.scale.set(30, 30, 30);
      dragon.position.set(0, -5, -5);

      // Hide everything except Object_12 (the claw)
      dragon.traverse((child) => {
        if (child.isMesh) {
          child.visible = child.name === "Object_12";
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

      // 1. Anticipation
      riftAction.timeScale = 0.15;
      riftAction.play();

      const tl = gsap.timeline();

      // 2. The "Impact" (Now Normal Speed)
      tl.to(riftAction, {
        timeScale: 1.0,
        duration: 0.5,
        delay: 0.8,
        ease: "power2.inOut",
      })
        // 3. The Settle
        .to(riftAction, {
          timeScale: 0.1,
          duration: 1.5,
          ease: "power1.out",
        });

      mixerRef.current = mixer;
      actionRef.current = riftAction;
      // Expose for DragonScene sync (though ClawScene will sync to DragonScene instead)
      window.primaryDragonAction = riftAction;
    });

    const timer = new Timer();

    function animate() {
      requestAnimationFrame(animate);

      timer.update();
      const delta = timer.getDelta();

      if (mixerRef.current && actionRef.current && window.primaryDragonAction) {
        // Sync to DragonScene's animation time
        actionRef.current.time = window.primaryDragonAction.time;
        // Update mixer with 0 delta to instantly apply that frame
        mixerRef.current.update(0);
      } else if (mixerRef.current) {
        mixerRef.current.update(delta);
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

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Timer } from "three";
import gsap from "gsap";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

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

    // --- NEW: POST-PROCESSING PIPELINE ---
    const renderScene = new RenderPass(scene, camera);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);

    // Parameters: resolution, strength, radius, threshold
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(W, H),
      3.0, // Strength of the glow (tweak this!)
      0.5, // Size/spread of the glow
      0.95, // Threshold: ignore everything unless nearly pure white (eyes only!)
    );
    composer.addPass(bloomPass);
    // -----------------------------------

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
      dragon.scale.set(45, 45, 45);
      dragon.position.set(0, -7, -5);
      scene.add(dragon);

      // Phase 3: Add glowing eyes piercing through the darkness
      const eyeGeo = new THREE.SphereGeometry(0.07, 16, 16);

      const eyeMat = new THREE.MeshBasicMaterial({
        // Multiply the color to make it aggressively bright for the Bloom pass
        color: new THREE.Color(0xcc33ff).multiplyScalar(20),
        transparent: true,
        opacity: 0, // Start invisible for the GSAP animation
        // depthTest: false, // Keep shining through the eyelids
        depthWrite: false,
      });

      const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
      const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);

      // Scale (X, Y, Z) - Stretch it wide, flatten the height
      leftEyeMesh.scale.set(1.5, 0.8, 1.0); 
      rightEyeMesh.scale.set(1.5, 0.8, 1.0);
      
      let eyeLights = [leftEyeMesh, rightEyeMesh];

      // Traverse to find the exact eye bones from the rig
      dragon.traverse((child) => {
        if (child.name === "Object_12") {
          child.visible = false;
          console.log("SUCCESS: Original claw (Object_12) hidden!");
        }
        if (child.name === "Eye_L_047") {
          child.add(leftEyeMesh);
          leftEyeMesh.position.set(0, 0, -0.05);
          console.log("SUCCESS: Left eye bone found and mesh attached!");
        }

        if (child.name === "Eye_R_048") {
          child.add(rightEyeMesh);
          rightEyeMesh.position.set(0, 0, 0.05);
          console.log("SUCCESS: Right eye bone found and mesh attached!");
        }
      });

      // Add PointLights to make the eyes cast light on the dragon
      const leftLight = new THREE.PointLight(0xcc33ff, 3, 20);
      leftEyeMesh.add(leftLight);
      leftLight.position.set(0, 0, 0.05);

      const rightLight = new THREE.PointLight(0xcc33ff, 3, 20);
      rightEyeMesh.add(rightLight);
      rightLight.position.set(0, 0, -0.05);

      // --- NEW: Setup references for the Flash Animation ---
      // We start everything at 0 so they burst out of the dark
      leftLight.intensity = 0;
      rightLight.intensity = 0;

      // Update eyeMat to start at 0 opacity
      eyeMat.opacity = 0;

      // Create a convenience object to animate everything together
      const glowElements = {
        intensity: 0,
        opacity: 0,
      };
      // -------------------------------------------------

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

      // --- PHASE 3: THE EYES IN THE DARK (FLASH ANIMATION) ---
      // Fire this right as the dragon becomes visible, around the 2.0s mark
      const eyeFlashTl = gsap.timeline({ delay: 3.0 });

      eyeFlashTl
        // 1. THE IMPACT FLASH (Instantly blindingly bright!)
        .to(glowElements, {
          intensity: 100, // MASSIVE light overload
          opacity: 1.0, // Solid glowing core
          duration: 0.05, // Split second burst (0.05s)
          ease: "expo.out", // Super sharp, immediate "stabbing" ease
          onUpdate: () => {
            // Apply GSAP interpolated values to actual lights/material
            leftLight.intensity = glowElements.intensity;
            rightLight.intensity = glowElements.intensity;
            eyeMat.opacity = glowElements.opacity;
          },
        })
        // 2. THE SETTLE (Slowly glows down to menacing level)
        .to(glowElements, {
          intensity: 3, // Back to sustainable light level
          opacity: 0.7, // Settle into standard additive glow
          duration: 2.5, // Long, slow settle
          ease: "power2.out", // Smooth natural fade
          onUpdate: () => {
            leftLight.intensity = glowElements.intensity;
            rightLight.intensity = glowElements.intensity;
            eyeMat.opacity = glowElements.opacity;
          },
        });
      // --------------------------------------------------

      // 4. Camera Shake
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

      timer.update();
      const delta = timer.getDelta();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Use composer for post-processing (bloom)
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

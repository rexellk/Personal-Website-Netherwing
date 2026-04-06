import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Timer } from "three";
import { loadNetherwingGLTF } from "./loadNetherwingGLTF";
import gsap from "gsap";
// import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
// import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
// import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// ── Butterfly tuning ──────────────────────────────────────────────────────────
const BUTTERFLY_COLORS = [
  new THREE.Color(2.5, 0.8, 5.0),  // lavender-white
  new THREE.Color(3.5, 0.5, 6.0),  // deep violet
  new THREE.Color(0.5, 5.0, 5.5),  // cyan-teal
];
const BUTTERFLY_COUNT      = 40;   // number of butterflies in the swarm
const BUTTERFLY_BRIGHTNESS = 0.1;  // base color multiplier; instanceColor tints per-particle
const GLOW_SIZE_MULT       = 0.00; // glow disc size relative to sprite size
const GLOW_BRIGHTNESS      = 0.00;  // glow disc color multiplier

const BG_STAR_INTENSITY = 0.7; // 1.0 = Base
// ─────────────────────────────────────────────────────────────────────────────

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
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      console.error('❌ WebGL context LOST', e)
    })
    console.log('canvas in DOM:', document.body.contains(renderer.domElement))
    console.log('canvas size:', renderer.domElement.width, renderer.domElement.height)
    console.log('canvas style:', renderer.domElement.style.cssText)

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    // --- POST-PROCESSING PIPELINE (disabled — EffectComposer corrupts WebGL context in prod) ---
    // const renderScene = new RenderPass(scene, camera);
    // const composer = new EffectComposer(renderer);
    // composer.addPass(renderScene);
    // const bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 3.0, 0.5, 0.95);
    // composer.addPass(bloomPass);
    // -----------------------------------

    // Hemisphere: purple sky above, near-black void below — gives the model a purple cast
    // without flattening it like a white ambient would
    // Hemisphere: purple sky above, near-black void below — gives the model a purple cast
    // without flattening it like a white ambient would
    // Hemisphere: purple sky above, near-black void below
    // Weak ambient so the shadow side isn't pure black
    scene.add(new THREE.AmbientLight(0x110022, 0.8));

    // Key light — strong, high-angle to create clear highlights and shadow depth
    const dirLight = new THREE.DirectionalLight(0xfff0f8, 2.0);
    dirLight.position.set(4, 8, 5);
    scene.add(dirLight);

    // Rim light — cold blue-violet from behind to separate dragon from background
    const rimLight = new THREE.DirectionalLight(0x4422ff, 2.0);
    rimLight.position.set(-4, 2, -4);
    scene.add(rimLight);

    // Under-fill — very dim purple bounce from below so belly has a hint of color
    const fillLight = new THREE.DirectionalLight(0x6600cc, 0.4);
    fillLight.position.set(0, -6, 2);
    scene.add(fillLight);

    // ==========================================
    // --- DEEP SPACE GALAXY SETUP ---
    // ==========================================
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i]     = (Math.random() - 0.5) * 100;
      starPos[i + 1] = (Math.random() - 0.5) * 100;
      starPos[i + 2] = -40 - Math.random() * 40;

      const isPurple = Math.random() > 0.6;
      const intensity = 2.0 + Math.random() * BG_STAR_INTENSITY;

      starColors[i]     = (isPurple ? 0.8 : 1.0) * intensity;
      starColors[i + 1] = (isPurple ? 0.2 : 1.0) * intensity;
      starColors[i + 2] = intensity;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);
    // ==========================================

    // --- BUTTERFLY SWARM SETUP ---
    const COUNT = BUTTERFLY_COUNT;
    const dummy = new THREE.Object3D();
    const butterflyData = [];
    let swarm;
    let glowMesh;

    // Butterfly swarm — invisible placeholder until a real sprite is provided
    const wingMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const wingGeo = new THREE.PlaneGeometry(0.4, 0.4);
    swarm = new THREE.InstancedMesh(wingGeo, wingMat, COUNT);
    scene.add(swarm);

    for (let i = 0; i < COUNT; i++) {
      butterflyData.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          -2 + (Math.random() - 0.5) * 4,
          -5 + (Math.random() - 0.5) * 3,
        ),
        speed: 0.01 + Math.random() * 0.02,
        offset: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI,
        colorIdx: Math.floor(Math.random() * BUTTERFLY_COLORS.length),
      });
    }
    // -------------------------

    let dragonRef = null;
    loadNetherwingGLTF().then((gltf) => {
      const dragon = gltf.scene;
      dragonRef = dragon;
      dragon.scale.set(45, 45, 45);
      dragon.position.set(0, -7, -5);
      scene.add(dragon);

      // Phase 3: Add glowing eyes piercing through the darkness
      const eyeGeo = new THREE.SphereGeometry(0.07, 16, 16);

      const eyeMat = new THREE.MeshBasicMaterial({
        // Multiply the color to make it aggressively bright for the Bloom pass
        color: new THREE.Color(0xE51247).multiplyScalar(20),
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

      // ==========================================
      // --- ANAMORPHIC FLARE SETUP (SMOOTH EDGES) ---
      // ==========================================
      const flareCanvas = document.createElement("canvas");
      // 1. MAKE IT SQUARE: This guarantees the glow never hits the edge
      flareCanvas.width = 256;
      flareCanvas.height = 256;
      const ctx = flareCanvas.getContext("2d");

      // 2. PERFECT CIRCLE: Center at 128, radius of 128
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");   // Solid white core
      gradient.addColorStop(0.1, "rgba(128, 128, 128, 1)"); // Grey middle
      gradient.addColorStop(1, "rgba(0, 0, 0, 1)");         // PURE BLACK (Invisible edge)

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

      const flareTexture = new THREE.CanvasTexture(flareCanvas);

      const flareMat = new THREE.SpriteMaterial({
        map: flareTexture,
        // Match this to whatever pure color you are using for your eyes!
        color: new THREE.Color(0xcc33ff).multiplyScalar(5),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      });

      // 3. STRETCH THE SQUARE INTO A BEAM
      const leftFlare = new THREE.Sprite(flareMat);
      // Because the image is a square now, we increase X to stretch it out
      leftFlare.scale.set(0.6, 0.05, 1); 
      // Push it slightly toward the outer edge of the eye
      leftFlare.position.x = 0.05; 

      const rightFlare = new THREE.Sprite(flareMat);
      rightFlare.scale.set(0.6, 0.05, 1);
      // Push it slightly toward the outer edge of the eye
      rightFlare.position.x = -0.05;

      leftEyeMesh.add(leftFlare);
      rightEyeMesh.add(rightFlare);
      // ==========================================

      // Traverse to find the exact eye bones from the rig
      dragon.traverse((child) => {
        if (child.name === "Object_12") {
          child.visible = false;
        }
        if (child.name === "Eye_L_047") {
          child.add(leftEyeMesh);
          leftEyeMesh.position.set(0, 0, -0.05);
        }

        if (child.name === "Eye_R_048") {
          child.add(rightEyeMesh);
          rightEyeMesh.position.set(0, 0, 0.05);
        }
      });

      // Add PointLights to make the eyes cast light on the dragon
      const leftLight = new THREE.PointLight(0xE51247, 3, 20);
      leftEyeMesh.add(leftLight);
      leftLight.position.set(0, 0, 0.05);

      const rightLight = new THREE.PointLight(0xE51247, 3, 20);
      rightEyeMesh.add(rightLight);
      rightLight.position.set(0, 0, -0.05);

      // Resting eye glow — subtle before the flash, will spike during animation
      const EYE_RESTING_INTENSITY = 10.0;
      const EYE_RESTING_OPACITY   = 1.0;
      leftLight.intensity  = EYE_RESTING_INTENSITY;
      rightLight.intensity = EYE_RESTING_INTENSITY;
      eyeMat.opacity = EYE_RESTING_OPACITY;

      // glowElements starts at resting values so flash animates FROM here
      const glowElements = {
        intensity: EYE_RESTING_INTENSITY,
        opacity:   EYE_RESTING_OPACITY,
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

      riftAction.timeScale = 0.15;
      riftAction.play();
      riftAction.paused = true; // Start frozen — wait for scroll trigger

      // Expose for ClawScene sync
      window.primaryDragonAction = riftAction;

      // Hide dragon until animation starts
      dragon.visible = false;

      window.shakeOffset = { x: 0, y: 0 };
      mixerRef.current = mixer;

      // Expose trigger — called by App.jsx on first scroll
      // Timelines created HERE so GSAP schedules them at trigger time,
      // avoiding accumulated lag from the paused→play pattern on Netlify
      window.startDragonAnimation = () => {
        console.log("🐉 startDragonAnimation called")
        dragon.visible = true;
        riftAction.paused = false;
        console.log("riftAction paused:", riftAction.paused, "timeScale:", riftAction.timeScale)

        const tl = gsap.timeline();

        tl.to(riftAction, {
          timeScale: 1.0,
          duration: 0.5,
          delay: 0.8,
          ease: "power2.inOut",
        })
          .to(riftAction, {
            timeScale: 0.1,
            duration: 1.5,
            ease: "power1.out",
          });

        tl.to(dragon.position, {
          z: 2.0,
          duration: 6.0,
          ease: "power4.in",
        }, 0);

        tl.to(
          camera.position,
          {
            duration: 2.5,
            x: "+=0.0",
            y: "+=0.0",
            modifiers: {
              x: () => {
                const time = tl.progress();
                const decay = Math.pow(1 - time, 2.0);
                const shakeX = (Math.random() - 0.5) * 0.6 * decay;
                window.shakeOffset.x = shakeX;
                return 0 + shakeX;
              },
              y: () => {
                const time = tl.progress();
                const decay = Math.pow(1 - time, 1.5);
                const shakeY = (Math.random() - 0.5) * 0.6 * decay;
                window.shakeOffset.y = shakeY;
                return 0 + shakeY;
              },
            },
            ease: "power2.out",
            onComplete: () => {
              camera.position.set(0, 0, 5);
              window.shakeOffset = { x: 0, y: 0 };
              window.dispatchEvent(new CustomEvent('dragonSceneDone'));
            },
          },
          2.0,
        );

        const eyeFlashTl = gsap.timeline({ delay: 3.0 });
        eyeFlashTl
          .to(glowElements, {
            intensity: 200,
            opacity: 1.0,
            duration: 0.05,
            ease: "expo.out",
            onUpdate: () => {
              leftLight.intensity = glowElements.intensity;
              rightLight.intensity = glowElements.intensity;
              eyeMat.opacity = glowElements.opacity;
            },
          })
          .to(flareMat, { opacity: 1.0, duration: 0.05, ease: "expo.out" }, "<")
          .to(flareMat, { opacity: 0, duration: 1.0, ease: "power2.out" }, ">")
          .to(glowElements, {
            intensity: EYE_RESTING_INTENSITY,
            opacity: EYE_RESTING_OPACITY,
            duration: 2.5,
            ease: "power2.out",
            onUpdate: () => {
              leftLight.intensity = glowElements.intensity;
              rightLight.intensity = glowElements.intensity;
              eyeMat.opacity = glowElements.opacity;
            },
          }, "<");

        setTimeout(() => {
          console.log("1s - z:", dragon.position.z, "progress:", tl.progress(), "riftTime:", riftAction.time, "timeScale:", riftAction.timeScale)
        }, 1000)
        setTimeout(() => {
          console.log("3s - z:", dragon.position.z, "progress:", tl.progress(), "riftTime:", riftAction.time, "timeScale:", riftAction.timeScale)
        }, 3000)
      };

      // Called at flash peak to hide dragon behind the white-out
      window.hideDragon = () => {
        dragon.visible = false;
        riftAction.paused = true;
      };

      // Signal ready — App.jsx may already be waiting for this
      window.dispatchEvent(new CustomEvent('dragonReady'));
    });

    // const clock = new THREE.Clock()
    const timer = new Timer();

    let logged = false;
    function animate() {
      requestAnimationFrame(animate);

      timer.update();
      const delta = timer.getDelta();

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      if (!logged && dragonRef) {
        logged = true;
        const wp = new THREE.Vector3();
        dragonRef.getWorldPosition(wp);
        console.log("dragon in scene:", scene.children.includes(dragonRef))
        console.log("dragon world pos:", wp.x, wp.y, wp.z)
      }

      // --- ANIMATE BUTTERFLY SWARM ---
      if (swarm) {
        const time = performance.now() * 0.001;

        starfield.rotation.z = time * 0.03;

        butterflyData.forEach((b, i) => {
          // 1. SWARM MOVEMENT (Circular wandering)
          b.pos.x += Math.sin(time * b.speed + b.offset) * 0.02;
          b.pos.y += Math.cos(time * b.speed + b.phase) * 0.01;
          b.pos.z += Math.sin(time * b.speed) * 0.02;

          // 2. WING FLAP + ROTATION (sprite animation)
          const flap = Math.sin(time * 15 + b.offset) * 0.3; // flap wing angle

          dummy.position.copy(b.pos);
          dummy.rotation.set(0.4, time * 0.5 + b.offset, flap); // slow z-rotation with wing flap
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          swarm.setMatrixAt(i, dummy.matrix);
          swarm.setColorAt(i, BUTTERFLY_COLORS[b.colorIdx]);

          // Glow disc — same position, no rotation, slightly larger
          if (glowMesh) {
            dummy.rotation.set(0, 0, 0);
            dummy.scale.setScalar(GLOW_SIZE_MULT);
            dummy.updateMatrix();
            glowMesh.setMatrixAt(i, dummy.matrix);
            glowMesh.setColorAt(i, BUTTERFLY_COLORS[b.colorIdx]);
          }
        });

        swarm.instanceMatrix.needsUpdate = true;
        if (swarm.instanceColor) swarm.instanceColor.needsUpdate = true;
        if (glowMesh) {
          glowMesh.instanceMatrix.needsUpdate = true;
          if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
        }
      }
      // ----------------------

      // Use composer for post-processing (bloom)
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

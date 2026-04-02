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
      const intensity = 2.0 + Math.random() * 5.0;

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
    const COUNT = 100; // Adjust for swarm density
    const dummy = new THREE.Object3D();
    const butterflyData = [];
    let swarm;

    // Load butterfly texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("/Butterfly_Sprite.png", (texture) => {
      // Optimization: Turn off mipmaps for small textures
      texture.minFilter = THREE.LinearFilter;

      // Create material with texture
      const wingMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 2.0,
        color: new THREE.Color(0xcc33ff).multiplyScalar(2.5), // Vibrant purple glow
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, // Magical glow effect
        alphaTest: 1.0, // Show more of the texture
      });

      // Create the Geometry (Plane for texture)
      const wingGeo = new THREE.PlaneGeometry(0.4, 0.4);

      swarm = new THREE.InstancedMesh(wingGeo, wingMat, COUNT);
      scene.add(swarm);

      // Initialize Random Positions
      for (let i = 0; i < COUNT; i++) {
        butterflyData.push({
          pos: new THREE.Vector3(
            (Math.random() - 0.5) * 4, // Close to dragon's head region
            -2 + (Math.random() - 0.5) * 4, // Around head height
            -5 + (Math.random() - 0.5) * 3, // Around dragon's Z
          ),
          speed: 0.01 + Math.random() * 0.02,
          offset: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI,
        });
      }
    });
    // -------------------------

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
      const leftLight = new THREE.PointLight(0xE51247, 3, 20);
      leftEyeMesh.add(leftLight);
      leftLight.position.set(0, 0, 0.05);

      const rightLight = new THREE.PointLight(0xE51247, 3, 20);
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

      riftAction.timeScale = 0.15;
      riftAction.play();
      riftAction.paused = true; // Start frozen — wait for scroll trigger

      // Expose for ClawScene sync
      window.primaryDragonAction = riftAction;

      // Hide dragon until animation starts
      dragon.visible = false;

      const tl = gsap.timeline({ paused: true });

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

      window.riftTimeOffset = 0.8 - 1.2;

      const eyeFlashTl = gsap.timeline({ paused: true, delay: 3.0 });

      eyeFlashTl
        // 1. THE IMPACT FLASH (Instantly blindingly bright!)
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
        // Spike flare at the same time as the flash
        .to(flareMat, { opacity: 1.0, duration: 0.05, ease: "expo.out" }, "<")
        // 2. THE ANAMORPHIC FLARE FADE (starts right after flash ends)
        .to(flareMat, { opacity: 0, duration: 1.0, ease: "power2.out" }, ">")
        // 3. THE SETTLE (starts at same time as flare fade)
        .to(glowElements, {
          intensity: 3,
          opacity: 0.7,
          duration: 2.5,
          ease: "power2.out",
          onUpdate: () => {
            leftLight.intensity = glowElements.intensity;
            rightLight.intensity = glowElements.intensity;
            eyeMat.opacity = glowElements.opacity;
          },
        }, "<");
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

      // Expose trigger — called by App.jsx on first scroll
      window.startDragonAnimation = () => {
        dragon.visible = true;
        riftAction.paused = false;
        tl.play();
        eyeFlashTl.play();
      };

      // Called at flash peak to hide dragon behind the white-out
      window.hideDragon = () => {
        dragon.visible = false;
        riftAction.paused = true;
      };

      // In case scroll fired before model finished loading
      if (window.riftPendingStart) {
        window.startDragonAnimation();
        window.riftPendingStart = false;
      }
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
          dummy.updateMatrix();
          swarm.setMatrixAt(i, dummy.matrix);
        });

        swarm.instanceMatrix.needsUpdate = true;
      }
      // ----------------------

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

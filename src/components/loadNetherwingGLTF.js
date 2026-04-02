import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

let cachedPromise = null;

/**
 * Loads netherwing_pollux.glb exactly once and returns a cloned copy.
 * Every caller gets its own deep-cloned scene + animations so Three.js
 * doesn't share mutable state between DragonScene and ClawScene.
 */
export function loadNetherwingGLTF() {
  if (!cachedPromise) {
    cachedPromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        "/netherwing_pollux.glb",
        resolve,
        undefined,
        reject,
      );
    });
  }

  // Each caller gets a structural clone so animations/materials are independent
  return cachedPromise.then((gltf) => ({
    scene: SkeletonUtils.clone(gltf.scene),
    animations: gltf.animations,
  }));
}

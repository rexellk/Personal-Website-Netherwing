import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

let cachedPromise = null;

/**
 * Loads netherwing_pollux.glb exactly once and returns a cloned copy.
 * Every caller gets its own deep-cloned scene + animations so Three.js
 * doesn't share mutable state between DragonScene and ClawScene.
 */
export function loadNetherwingGLTF() {
  if (!cachedPromise) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    cachedPromise = new Promise((resolve, reject) => {
      gltfLoader.load(
        `${import.meta.env.BASE_URL}netherwing_pollux.glb`,
        resolve,
        undefined,
        reject,
      );
    });
  }

  // Each caller gets a structural clone with fully independent materials and textures
  // so separate WebGL contexts (DragonScene + ClawScene) don't share GPU objects
  return cachedPromise.then((gltf) => {
    const clonedScene = SkeletonUtils.clone(gltf.scene);

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        const cloned = mats.map(m => {
          const mat = m.clone();
          if (mat.map)          mat.map          = mat.map.clone();
          if (mat.normalMap)    mat.normalMap    = mat.normalMap.clone();
          if (mat.roughnessMap) mat.roughnessMap = mat.roughnessMap.clone();
          if (mat.metalnessMap) mat.metalnessMap = mat.metalnessMap.clone();
          if (mat.emissiveMap)  mat.emissiveMap  = mat.emissiveMap.clone();
          return mat;
        });
        child.material = Array.isArray(child.material) ? cloned : cloned[0];
      }
    });

    return { scene: clonedScene, animations: gltf.animations };
  });
}

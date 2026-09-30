// Shared viewport helpers for the Three.js scenes, so every renderer resizes
// live and frames the dragon the same way on desktop, tablet and phone.

// Up to six WebGL canvases can run at once during the intro, so touch devices
// (high-DPR phones) render at a lower pixel ratio than desktops.
export function cappedPixelRatio() {
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
}

// Perspective cameras are tuned for landscape screens. Below `refAspect`, widen
// the vertical FOV so the horizontal view stays what `refAspect` would show —
// otherwise portrait phones crop the dragon to a sliver. Capped at `maxFov` to
// avoid fisheye distortion on very tall screens.
export function fitPerspective(camera, width, height, { baseFov, refAspect = 1.25, maxFov = 80 }) {
  const aspect = width / height;
  camera.aspect = aspect;
  if (aspect < refAspect) {
    const halfTan = Math.tan((baseFov * Math.PI) / 360) * (refAspect / aspect);
    camera.fov = Math.min(maxFov, (Math.atan(halfTan) * 360) / Math.PI);
  } else {
    camera.fov = baseFov;
  }
  camera.updateProjectionMatrix();
}

// Calls `cb(width, height)` on window resize / orientation change, at most once
// per animation frame. Returns an unsubscribe function.
export function onViewportResize(cb) {
  let raf = 0;
  const handler = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      cb(window.innerWidth, window.innerHeight);
    });
  };
  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  return () => {
    window.removeEventListener("resize", handler);
    window.removeEventListener("orientationchange", handler);
    if (raf) cancelAnimationFrame(raf);
  };
}

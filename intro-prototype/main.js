// Review page for the intro cinematic. The cinematic itself lives in
// ../src/intro/netherwingIntro.js (shared with the site); this file only wires the HUD:
// Play / space, slider scrub, ←/→ step, `?nohud`, and the debug URL knobs it forwards.
import { mountIntro, DURATION, SHOTS } from "../src/intro/netherwingIntro.js";

const params = new URLSearchParams(location.search);
if (params.has("nohud")) document.getElementById("hud").classList.add("hidden");

// Assets live in portfolio/public/intro/. Served at /intro/ by Vite; via a plain static
// server rooted above portfolio/ (port 5199) they're reached relatively.
const assetBase = location.pathname.startsWith("/portfolio/") ? "../public/intro/" : "/intro/";

const stage = document.getElementById("stage");
const intro = await mountIntro(stage, { assetBase, params: location.search });

const scrub = document.getElementById("scrub"), timeEl = document.getElementById("time"), shotEl = document.getElementById("shot");
scrub.max = DURATION;
document.getElementById("play").onclick = () => intro.play();
document.getElementById("idle").onclick = () => intro.setT(0);
scrub.oninput = () => intro.setT(Number(scrub.value));
addEventListener("keydown", (e) => {
  if (e.key === " ") { e.preventDefault(); intro.isPlaying() ? intro.pause() : intro.play(); }
  if (e.key === "ArrowRight") intro.setT(Math.min(DURATION, intro.getT() + 1 / 30));
  if (e.key === "ArrowLeft") intro.setT(Math.max(0, intro.getT() - 1 / 30));
});
addEventListener("wheel", (e) => { if (!intro.isPlaying() && intro.getT() === 0 && e.deltaY > 0) intro.play(); }, { passive: true });

function hud() {
  requestAnimationFrame(hud);
  const t = intro.getT();
  scrub.value = t; timeEl.textContent = t.toFixed(2) + "s";
  shotEl.textContent = t === 0 && !intro.isPlaying() ? "0 · It waits (idle) — press Play / scroll" : SHOTS.filter((s) => t >= s[0]).pop()[1];
}
hud();

// for scripted screenshots / probes
window.__setT = (x) => intro.setT(x);
window.__cam = intro.camera;
window.__model = intro.model;
window.__probe = (x) => intro.probe(x);
window.__ready = true;

import { useState, useEffect } from "react";
import { HERO } from "../data/portfolioData";

function fmtMB(bytes) {
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function Hero({ riftTriggered, modelReady, animOn = true }) {
  const [visible, setVisible] = useState(true);
  const [glbProgress, setGlbProgress] = useState(null);
  // Legibility shadow behind the name + lines, only once the dragon intro is done (the open rift sits behind them)
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const onDone = () => setIntroDone(true);
    window.addEventListener('dragonSceneDone', onDone, { once: true });
    return () => window.removeEventListener('dragonSceneDone', onDone);
  }, []);

  useEffect(() => {
    if (riftTriggered) setVisible(false);
  }, [riftTriggered]);

  useEffect(() => {
    const onDone = () => setVisible(true);
    window.addEventListener('riftFlashDone', onDone);
    return () => window.removeEventListener('riftFlashDone', onDone);
  }, []);

  useEffect(() => {
    const onProgress = (e) => setGlbProgress(e.detail);
    window.addEventListener('glbProgress', onProgress);
    return () => window.removeEventListener('glbProgress', onProgress);
  }, []);

  return (
    <section
      id="hero"
      className={introDone ? "pv-hero-legible" : undefined}
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 15,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: -60,
            background: "radial-gradient(ellipse 65% 45% at 50% 50%, rgba(143,120,196,0.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <h1 style={{ position: "relative", margin: 0, fontWeight: 400 }}>
          <span className="pv-name-first">{HERO.firstName}</span>
          <span className="pv-name-last">{HERO.lastName}</span>
        </h1>
      </div>

      <p className="pv-role-line">{HERO.tagline}</p>

      <p className="pv-sub-text">{HERO.sub}</p>

      <div className="pv-cta-row">
        <a href={HERO.resumeUrl} className="pv-btn-primary" target="_blank" rel="noreferrer">View resume</a>
        <a href={`mailto:${HERO.email}`} className="pv-btn-ghost">Email me</a>
      </div>

      <div className="pv-scroll-hint">
        {/* Anim off: nothing to wait for (the rift never opens), so the loading line gives way to the
            scroll cue; the download carries on quietly, and turning anim back on mid-load brings the
            MB counter back where it is */}
        {modelReady || !animOn
          ? <div className="pv-scroll-line" />
          : <div style={{ fontFamily: "var(--pv-body)", fontSize: 13, color: "var(--pv-text-faint)", whiteSpace: "nowrap", textAlign: "center", animation: "pv-fadeIn 0.5s ease forwards" }}>
              Loading the dragon{glbProgress ? ` (${fmtMB(glbProgress.loaded)}${glbProgress.total ? ` of ${fmtMB(glbProgress.total)}` : ''})` : ''}
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Turn animations off to skip loading</div>
            </div>
        }
      </div>
    </section>
  );
}

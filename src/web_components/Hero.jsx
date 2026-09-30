import { useState, useEffect } from "react";
import { HERO } from "../data/portfolioData";

function fmtMB(bytes) {
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function Hero({ riftTriggered, modelReady }) {
  const [visible, setVisible] = useState(true);
  const [glbProgress, setGlbProgress] = useState(null);

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
      style={{
        minHeight: "100vh",
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
        {modelReady
          ? <div className="pv-scroll-line" />
          : <div style={{ fontFamily: "var(--pv-body)", fontSize: 13, color: "var(--pv-text-faint)", whiteSpace: "nowrap", animation: "pv-fadeIn 0.5s ease forwards" }}>
              Loading the dragon{glbProgress ? ` (${fmtMB(glbProgress.loaded)}${glbProgress.total ? ` of ${fmtMB(glbProgress.total)}` : ''})` : ''}
            </div>
        }
      </div>
    </section>
  );
}

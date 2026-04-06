import { useState, useEffect } from "react";
import { HERO } from "../data/portfolioData";

function fmtMB(bytes) {
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const BotanicLeft = () => (
  <svg
    style={{ position: "absolute", left: 32, bottom: 80, opacity: 0.18, pointerEvents: "none", transform: "rotate(-12deg)" }}
    width="180" height="300" viewBox="0 0 180 300" fill="none"
  >
    <path d="M90 290 Q85 240 70 200 Q55 160 40 120 Q25 80 30 40" stroke="rgba(199,125,255,0.5)" strokeWidth="1" fill="none" />
    <path d="M70 200 Q40 190 20 170 Q0 150 10 120" stroke="rgba(199,125,255,0.35)" strokeWidth="0.8" fill="none" />
    <path d="M55 160 Q75 140 90 110 Q105 80 100 50" stroke="rgba(199,125,255,0.35)" strokeWidth="0.8" fill="none" />
    <ellipse cx="45" cy="172" rx="12" ry="6" fill="rgba(199,125,255,0.12)" transform="rotate(-30 45 172)" />
    <ellipse cx="92" cy="112" rx="10" ry="5" fill="rgba(255,179,198,0.18)" transform="rotate(20 92 112)" />
    <circle cx="30" cy="42" r="5" fill="rgba(255,179,198,0.28)" />
    <circle cx="98" cy="51" r="4" fill="rgba(224,170,255,0.28)" />
  </svg>
);

const BotanicRight = () => (
  <svg
    style={{ position: "absolute", right: 32, top: 110, opacity: 0.18, pointerEvents: "none", transform: "rotate(18deg) scaleX(-1)" }}
    width="180" height="300" viewBox="0 0 180 300" fill="none"
  >
    <path d="M90 290 Q85 240 70 200 Q55 160 40 120 Q25 80 30 40" stroke="rgba(199,125,255,0.5)" strokeWidth="1" fill="none" />
    <path d="M70 200 Q40 190 20 170 Q0 150 10 120" stroke="rgba(199,125,255,0.35)" strokeWidth="0.8" fill="none" />
    <path d="M55 160 Q75 140 90 110 Q105 80 100 50" stroke="rgba(199,125,255,0.35)" strokeWidth="0.8" fill="none" />
    <ellipse cx="45" cy="172" rx="12" ry="6" fill="rgba(199,125,255,0.12)" transform="rotate(-30 45 172)" />
    <circle cx="30" cy="42" r="5" fill="rgba(255,179,198,0.28)" />
  </svg>
);

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
      <BotanicLeft />
      <BotanicRight />

      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: -60,
            background: "radial-gradient(ellipse 65% 45% at 50% 50%, rgba(157,78,221,0.18), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <span className="pv-name-first">{HERO.firstName}</span>
        <span className="pv-name-last">{HERO.lastName}</span>
      </div>

      <div className="pv-role-line">
        <span style={{ fontSize: 16, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(199,125,255,0.72)" }}>
          {HERO.tagline}
        </span>
      </div>

      <p className="pv-sub-text">{HERO.sub}</p>

      <div className="pv-cta-row">
        <a href={HERO.resumeUrl} className="pv-btn-primary" target="_blank" rel="noreferrer">View Resume</a>
        <a href={`mailto:${HERO.email}`} className="pv-btn-ghost">Email</a>
      </div>

<div className="pv-scroll-hint">
        {modelReady
          ? <div className="pv-scroll-line" />
          : <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(199,125,255,0.4)", animation: "pv-fadeIn 0.5s ease forwards" }}>
              Animation Loading: {glbProgress ? ` ${fmtMB(glbProgress.loaded)}${glbProgress.total ? ` / ${fmtMB(glbProgress.total)}` : ''}` : ''}
            </div>
        }
      </div>
    </section>
  );
}

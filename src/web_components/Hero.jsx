import React from "react";

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
  const [visible, setVisible] = React.useState(true);
  const [audioActivated, setAudioActivated] = React.useState(false);

  React.useEffect(() => {
    const onPointer = () => setAudioActivated(true);
    window.addEventListener('pointerdown', onPointer, { once: true });
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  React.useEffect(() => {
    if (riftTriggered) setVisible(false);
  }, [riftTriggered]);

  React.useEffect(() => {
    const onDone = () => setVisible(true);
    window.addEventListener('riftFlashDone', onDone);
    return () => window.removeEventListener('riftFlashDone', onDone);
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
        zIndex: 10,
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
        <span className="pv-name-first">Rexell</span>
        <span className="pv-name-last">Kurniawan</span>
      </div>

      <div className="pv-role-line">
        <span style={{ fontSize: 12, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(199,125,255,0.72)" }}>
          Software Engineer &nbsp;&middot;&nbsp; Builder &nbsp;&middot;&nbsp; U of Michigan
        </span>
      </div>

      <p className="pv-sub-text">
        Ann Arbor, Michigan &nbsp;&bull;&nbsp; San Francisco &rarr; May 2026
      </p>

      <div className="pv-cta-row">
        <a href="https://drive.google.com/file/d/10dNoRvINeiCV5MuUxld_YrD9HZ1axYkH/view?usp=sharing" className="pv-btn-primary" target="_blank" rel="noreferrer">View Resume</a>
        <a href="mailto:rexellk@umich.edu" className="pv-btn-ghost">Get In Touch</a>
      </div>

      <div style={{ position: "absolute", bottom: 72, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: 0, animation: "pv-fadeIn 1s ease 2.2s forwards" }}>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: audioActivated ? "rgba(72,202,228,0.6)" : "rgba(199,125,255,0.35)", transition: "color 0.4s ease" }}>
          {audioActivated ? "Audio Activated" : "Click anywhere for audio"}
        </span>
      </div>

      <div className="pv-scroll-hint">
        {modelReady
          ? <div className="pv-scroll-line" />
          : <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(199,125,255,0.4)", animation: "pv-fadeIn 0.5s ease forwards" }}>Animation Loading…</div>
        }
      </div>
    </section>
  );
}

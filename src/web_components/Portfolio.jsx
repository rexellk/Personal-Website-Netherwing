import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import "./portfolio.css";

import ButterflyCanvas from "./ButterflyCanvas";
import PortfolioNav from "./PortfolioNav";
import SectionDivider from "./SectionDivider";
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Contact from "./Contact";
import TronDecor from "./TronDecor";

function Cursor() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", onMove);

    let id;
    function loop() {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
      }
      id = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(id);
    };
  }, []);

  const base = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 9999,
    transform: "translate(-50%, -50%)",
    mixBlendMode: "screen",
  };

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          ...base,
          width: 8, height: 8,
          background: "var(--pv-lavender)",
          borderRadius: "50%",
        }}
      />
      <div
        ref={ringRef}
        style={{
          ...base,
          zIndex: 9998,
          width: 30, height: 30,
          border: "1px solid rgba(199,125,255,0.35)",
          borderRadius: "50%",
        }}
      />
    </>
  );
}

function ScrollVine() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, p));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed", left: 28, top: 0, bottom: 0, width: 1,
          zIndex: 5, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent 0%, rgba(199,125,255,0.15) 20%, rgba(199,125,255,0.15) 80%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "fixed", left: 28, top: 0, width: 1,
          height: `${progress * 100}vh`,
          zIndex: 6, pointerEvents: "none",
          background: "linear-gradient(to bottom, var(--pv-lavender), var(--pv-purple-light))",
          transition: "height 0.1s linear",
        }}
      />
    </>
  );
}

function Socials() {
  const style = {
    position: "fixed", left: 48, bottom: 72, zIndex: 100,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    opacity: 0, animation: "pv-fadeIn 1s ease 1.8s forwards",
  };
  return (
    <div style={style}>
      <a href="https://linkedin.com/in/rexellkurniawan" className="pv-social-link" target="_blank" rel="noreferrer">
        LinkedIn
      </a>
      <a href="https://github.com/rexellk" className="pv-social-link" target="_blank" rel="noreferrer">
        GitHub
      </a>
      <div style={{ width: 1, height: 44, background: "linear-gradient(to bottom, rgba(199,125,255,0.3), transparent)", marginTop: 4 }} />
    </div>
  );
}

function StatusTag({ muted, setMuted }) {
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const onDone = () => setHintVisible(false);
    window.addEventListener('riftTrigger', onDone, { once: true });
    return () => window.removeEventListener('riftTrigger', onDone);
  }, []);

  return (
    <div
      style={{
        position: "fixed", right: 36, bottom: 72, zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        opacity: 0, animation: "pv-fadeIn 1s ease 2s forwards",
      }}
    >
      {/* Hint label + curved arrow pointing right toward the button */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
        <div style={{
          position: "absolute", right: 46, top: "50%", transform: "translateY(-80%)",
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
          pointerEvents: "none",
          opacity: hintVisible ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}>
          <span style={{
            fontFamily: "'Jost', sans-serif", fontSize: 8, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(199,125,255,0.28)",
            whiteSpace: "nowrap", textAlign: "right",
          }}>
            press for immersive
          </span>
          <span style={{
            fontFamily: "'Jost', sans-serif", fontSize: 8, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(199,125,255,0.28)",
            whiteSpace: "nowrap", textAlign: "right",
          }}>
            experience
          </span>
          {/* Curved arrow SVG pointing right */}
          <svg width="28" height="18" viewBox="0 0 28 18" fill="none" style={{ marginTop: 2, alignSelf: "flex-end" }}>
            <path d="M2 14 Q10 2 22 8" stroke="rgba(199,125,255,0.28)" strokeWidth="1" fill="none" strokeLinecap="round" />
            <polyline points="19,5 22,8 18,10" stroke="rgba(199,125,255,0.28)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <button
          onClick={() => setMuted(m => !m)}
          style={{
            background: "rgba(10,0,20,0.7)", border: "1px solid rgba(199,125,255,0.3)",
            borderRadius: "50%", width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(199,125,255,0.8)",
            backdropFilter: "blur(8px)", transition: "border-color 0.2s, color 0.2s",
            padding: 0, flexShrink: 0,
          }}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted
            ? <VolumeX size={16} color="rgba(199,125,255,0.8)" strokeWidth={1.5} />
            : <Volume2 size={16} color="rgba(199,125,255,0.8)" strokeWidth={1.5} />
          }
        </button>
      </div>
      <div className="pv-status-dot" />
      <div
        style={{
          padding: "5px 12px", borderRadius: 100,
          border: "1px solid rgba(72,202,228,0.28)",
          background: "rgba(72,202,228,0.06)",
          fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(72,202,228,0.7)",
          writingMode: "vertical-rl",
          fontFamily: "'Jost', sans-serif",
        }}
      >
        Amazon eero &middot; iOS SDE Intern
      </div>
    </div>
  );
}

export default function Portfolio({ modelReady, muted, setMuted }) {
  const [riftTriggered, setRiftTriggered] = useState(false);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const dragonFly2Fired = useRef(false);
  const dragonSceneDone = useRef(false);
  const experiencePassed = useRef(false);
  const dragonFlyFired = useRef(false);
  const DRAGONFLY_TRIGGER = 1.0; // 0.0 = top of screen, 1.0 = bottom of screen, >1.0 = below viewport

  useEffect(() => {
    const onTrigger = () => setRiftTriggered(true);
    window.addEventListener('riftTrigger', onTrigger);
    return () => window.removeEventListener('riftTrigger', onTrigger);
  }, []);

  // Track when DragonScene animation finishes
  useEffect(() => {
    const onDone = () => { dragonSceneDone.current = true; };
    window.addEventListener('dragonSceneDone', onDone);
    return () => window.removeEventListener('dragonSceneDone', onDone);
  }, []);

  // Fire DragonFly_2 once BOTH conditions are met: dragon scene done + scrolled past Experience
  useEffect(() => {
    const el = aboutRef.current;
    if (!el) return;

    function tryFire() {
      if (dragonFly2Fired.current) return;
      if (!dragonSceneDone.current || !experiencePassed.current) return;
      dragonFly2Fired.current = true;
      window.startDragonFly2?.();
    }

    const onScroll = () => {
      if (!experiencePassed.current) {
        const bottom = el.getBoundingClientRect().bottom;
        if (bottom < 0) experiencePassed.current = true;
      }
      tryFire();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('dragonSceneDone', tryFire);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('dragonSceneDone', tryFire);
    };
  }, []);

  // Fire DragonFly once when the Contact ("Let's Build") section enters the viewport
  useEffect(() => {
    const el = contactRef.current;
    if (!el) return;
    function tryFireDragonFly() {
      if (dragonFlyFired.current) return;
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * DRAGONFLY_TRIGGER && window.startDragonRoar) {
        dragonFlyFired.current = true;
        window.startDragonRoar();
      }
    }

    const onScroll = () => tryFireDragonFly();

    // Also try once the model finishes loading, in case the section was already visible
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('dragonRoarReady', tryFireDragonFly);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('dragonRoarReady', tryFireDragonFly);
    };
  }, []);

  return (
    <div
      style={{
        background: "transparent",
        color: "var(--pv-silver)",
        fontFamily: "'Jost', sans-serif",
        fontWeight: 300,
        overflowX: "hidden",
        cursor: "none",
        minHeight: "100vh",
      }}
    >
      <Cursor />
      <ButterflyCanvas />
      <ScrollVine />

      {/* Fixed ambient rift glow behind everything */}
      <div className="pv-rift-glow" />

      <PortfolioNav />
      <Socials />
      <StatusTag muted={muted} setMuted={setMuted} />

      <main>
        {/* Hero is transparent — rift canvas shows through as its background */}
        <Hero riftTriggered={riftTriggered} modelReady={modelReady} />

        {/* Opaque cover so portfolio sections scroll over the rift cleanly */}
        <div style={{ background: "var(--pv-void)", position: "relative", zIndex: 15, overflowX: "hidden" }}>
          <TronDecor />
          <SectionDivider variant="purple" />
          <div ref={aboutRef}>
            <About />
          </div>
          <SectionDivider variant="pink" />
          <Experience />
          <SectionDivider variant="purple" />
          <Projects />
          <div ref={contactRef}>
            <Contact />
          </div>
        </div>
      </main>
    </div>
  );
}

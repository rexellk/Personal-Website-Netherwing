import { useEffect, useRef, useState } from "react";
import "./portfolio.css";

import ButterflyCanvas from "./ButterflyCanvas";
import MegaphoneIcon from "./MegaphoneIcon";
import DragonHeadIcon from "./DragonHeadIcon";
import PortfolioNav from "./PortfolioNav";
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Contact from "./Contact";
import TronDecor from "./TronDecor";
import SectionDivider from "./SectionDivider";
import BackgroundAccents from "./BackgroundAccents";

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
    // the trailing ring's loop sleeps once it has caught up with the cursor (no idle per-frame work)
    let id = 0;
    function loop() {
      const dx = mouse.current.x - ring.current.x, dy = mouse.current.y - ring.current.y;
      ring.current.x += dx * 0.12;
      ring.current.y += dy * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
      }
      id = Math.abs(dx) + Math.abs(dy) > 0.3 ? requestAnimationFrame(loop) : 0;
    }
    const wake = () => { if (!id) id = requestAnimationFrame(loop); };
    window.addEventListener("mousemove", wake);
    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", wake);
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
        className="pv-cursor"
        style={{
          ...base,
          width: 8, height: 8,
          background: "var(--pv-lavender)",
          borderRadius: "50%",
        }}
      />
      <div
        ref={ringRef}
        className="pv-cursor"
        style={{
          ...base,
          zIndex: 9998,
          width: 30, height: 30,
          border: "1px solid rgba(201,139,230,0.4)",
          borderRadius: "50%",
        }}
      />
    </>
  );
}

function ScrollVine() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const p = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        setProgress(Math.min(1, p));
        rafId = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div
        className="pv-scroll-vine"
        style={{
          position: "fixed", left: 28, top: 0, bottom: 0, width: 1,
          zIndex: 5, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent 0%, rgba(143,120,196,0.18) 20%, rgba(143,120,196,0.18) 80%, transparent 100%)",
        }}
      />
      <div
        className="pv-scroll-vine"
        style={{
          position: "fixed", left: 28, top: 0, width: 1,
          height: `${progress * 100}vh`,
          zIndex: 6, pointerEvents: "none",
          background: "linear-gradient(to bottom, var(--pv-petal), var(--pv-orchid))",
          transition: "height 0.1s linear",
        }}
      />
    </>
  );
}

// Wireframe megaphone — faint glass outline when off; glowing lilac with
// guilloché lines in the bell and rippling sound arcs when on.
function SoundToggle({ muted, onToggle, calling }) {
  const on = !muted;
  return (
    <button
      className={`pv-sound${on ? " on" : ""}${calling ? " calling" : ""}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Turn sound off" : "Turn sound on"}
    >
      <MegaphoneIcon width={62} />
      <span className="pv-sound-label">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}

// Netherwing-head toggle for the dragon animations (state lives in App: window.animEnabled)
function AnimToggle({ animOn, onToggle }) {
  return (
    <button
      className={`pv-sound pv-anim${animOn ? " on" : ""}`}
      onClick={onToggle}
      aria-pressed={animOn}
      aria-label={animOn ? "Turn dragon animations off" : "Turn dragon animations on"}
      title={animOn ? "Turn dragon animations off" : "Turn dragon animations on"}
    >
      <DragonHeadIcon height={46} />
      <span className="pv-sound-label">{animOn ? "Anim on" : "Anim off"}</span>
    </button>
  );
}

function StatusTag({ muted, setMuted, animOn, setAnimOn }) {
  const [introPending, setIntroPending] = useState(true);

  useEffect(() => {
    const onDone = () => setIntroPending(false);
    window.addEventListener('riftTrigger', onDone, { once: true });
    window.addEventListener('dragonSceneDone', onDone, { once: true });   // intro skipped (anim off)
    return () => {
      window.removeEventListener('riftTrigger', onDone);
      window.removeEventListener('dragonSceneDone', onDone);
    };
  }, []);

  return (
    <div className={`pv-status${introPending ? "" : " intro-done"}`}>
      <AnimToggle animOn={animOn} onToggle={() => setAnimOn(a => !a)} />
      <div>
        {/* Calls out (pulsing arcs) while muted, until the intro starts */}
        <SoundToggle muted={muted} calling={muted && introPending} onToggle={() => setMuted(m => !m)} />
      </div>
    </div>
  );
}

export default function Portfolio({ modelReady, muted, setMuted, animOn, setAnimOn }) {
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
      if (window.animEnabled === false) return;   // anim off: never starts (one already flying finishes)
      if (!window.startDragonFly2) return;         // still loading (it loads after the intro); retried on dragonFly2Ready
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
    window.addEventListener('dragonFly2Ready', tryFire);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('dragonSceneDone', tryFire);
      window.removeEventListener('dragonFly2Ready', tryFire);
    };
  }, []);

  // Fire DragonFly once when the Contact ("Let's Build") section enters the viewport
  useEffect(() => {
    const el = contactRef.current;
    if (!el) return;
    function tryFireDragonFly() {
      if (dragonFlyFired.current || window.animEnabled === false) return;
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
      className="pv-root"
      style={{
        background: "transparent",
        color: "var(--pv-silver)",
        fontFamily: "var(--pv-body)",
        fontWeight: 300,
        overflowX: "clip",
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
      <StatusTag muted={muted} setMuted={setMuted} animOn={animOn} setAnimOn={setAnimOn} />

      <main>
        {/* Hero is transparent — rift canvas shows through as its background */}
        <Hero riftTriggered={riftTriggered} modelReady={modelReady} animOn={animOn} />

        {/* Opaque cover so portfolio sections scroll over the rift cleanly. The shadow paints a
            screen of the same void colour below the page end (no layout/scroll change), so a hard
            flick's overscroll bounce shows more cover instead of the fixed rift sky behind it. */}
        <div style={{ background: "var(--pv-void)", position: "relative", zIndex: 15, overflowX: "clip", boxShadow: "0 100vh 0 0 var(--pv-void)" }}>
          <BackgroundAccents />
          <TronDecor />
          <div ref={aboutRef}>
            <About />
          </div>
          <SectionDivider />
          <Experience />
          <SectionDivider />
          <Projects />
          <SectionDivider variant="pair" />
          <div ref={contactRef}>
            <Contact />
          </div>
        </div>
      </main>
    </div>
  );
}

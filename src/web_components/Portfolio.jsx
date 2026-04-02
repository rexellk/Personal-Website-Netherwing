import { useEffect, useRef, useState } from "react";
import "./portfolio.css";

import ButterflyCanvas from "./ButterflyCanvas";
import PortfolioNav from "./PortfolioNav";
import SectionDivider from "./SectionDivider";
import Hero from "./Hero";
import About from "./About";
import Experience from "./Experience";
import Projects from "./Projects";
import Contact from "./Contact";

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

function StatusTag() {
  return (
    <div
      style={{
        position: "fixed", right: 36, bottom: 72, zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        opacity: 0, animation: "pv-fadeIn 1s ease 2s forwards",
      }}
    >
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

export default function Portfolio() {
  return (
    <div
      style={{
        background: "var(--pv-void)",
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
      <StatusTag />

      <main>
        <Hero />
        <SectionDivider variant="purple" />
        <About />
        <SectionDivider variant="pink" />
        <Experience />
        <SectionDivider variant="purple" />
        <Projects />
        <Contact />
      </main>
    </div>
  );
}

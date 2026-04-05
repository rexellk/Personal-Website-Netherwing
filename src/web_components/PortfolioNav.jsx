import { useState, useEffect } from "react";

const SECTIONS = [
  { label: "Home",       id: "hero" },
  { label: "About",      id: "about" },
  { label: "Experience", id: "experience" },
  { label: "Projects",   id: "projects" },
  { label: "Contact",    id: "contact" },
];

export default function PortfolioNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("hero");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onDone = () => setReady(true);
    window.addEventListener('dragonSceneDone', onDone, { once: true });
    return () => window.removeEventListener('dragonSceneDone', onDone);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is in view
  useEffect(() => {
    const observers = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (!ready) return null;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        opacity: 0,
        animation: "pv-fadeIn 0.8s ease forwards",
        display: "flex",
        justifyContent: "center",
        padding: scrolled ? "16px 48px" : "24px 48px",
        transition: "padding 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "center",
          padding: "10px 28px",
          borderRadius: 100,
          border: scrolled
            ? "1px solid rgba(199,125,255,0.22)"
            : "1px solid rgba(199,125,255,0.14)",
          backdropFilter: "blur(16px)",
          background: scrolled ? "rgba(3,0,10,0.82)" : "rgba(3,0,10,0.6)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {SECTIONS.map((link) => {
          const isActive = active === link.id;
          return (
            <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span
                  className="pv-nav-link"
                  onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    color: isActive ? "var(--pv-lavender)" : undefined,
                    transition: "color 0.3s",
                    cursor: "pointer",
                  }}
                >
                  {link.label}
                </span>

                {/* Active dot indicator */}
                <div
                  style={{
                    width: isActive ? 16 : 0,
                    height: 2,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, var(--pv-purple-light), var(--pv-lavender))",
                    boxShadow: isActive ? "0 0 8px rgba(199,125,255,0.7)" : "none",
                    transition: "width 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s",
                    position: "absolute",
                    bottom: -6,
                  }}
                />
              </div>

            </div>
          );
        })}
      </div>
    </nav>
  );
}

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
        // Active = the section crossing the middle of the viewport (works for sections of any height)
        { rootMargin: "-45% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (!ready) return null;

  return (
    <nav className={`pv-nav${scrolled ? " scrolled" : ""}`}>
      <div className="pv-nav-links">
        {SECTIONS.map((link) => {
          const isActive = active === link.id;
          return (
            <div key={link.id} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button
                className="pv-nav-link"
                aria-current={isActive ? "true" : undefined}
                onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" })}
              >
                {link.label}
              </button>

              {/* Active marker — a small glowing dot */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute", bottom: -6,
                  width: 4, height: 4, borderRadius: "50%",
                  background: "var(--pv-petal)",
                  boxShadow: "0 0 8px rgba(240,201,228,0.8)",
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "scale(1)" : "scale(0.4)",
                  transition: "opacity 0.35s, transform 0.35s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
          );
        })}
      </div>
    </nav>
  );
}

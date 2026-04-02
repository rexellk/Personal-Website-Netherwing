import { useState, useEffect } from "react";

export default function PortfolioNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
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
        {links.map((link, i) => (
          <>
            <a key={link.href} href={link.href} className="pv-nav-link">
              {link.label}
            </a>
            {i < links.length - 1 && (
              <div
                key={`sep-${i}`}
                style={{
                  width: 3, height: 3,
                  borderRadius: "50%",
                  background: "rgba(199,125,255,0.25)",
                }}
              />
            )}
          </>
        ))}
      </div>
    </nav>
  );
}

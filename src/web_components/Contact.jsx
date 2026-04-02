import Reveal from "./Reveal";

const S = {
  section: { padding: "60px 80px 140px", textAlign: "center", position: "relative", zIndex: 10 },
  inner: { maxWidth: 640, margin: "0 auto" },
  dividerLine: { flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(199,125,255,0.12), transparent)" },
  bigTitle: {
    fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
    fontSize: "clamp(48px, 8vw, 96px)", color: "#fff", lineHeight: 0.9,
    margin: "48px 0 32px",
  },
  bigEm: { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  sub: { fontSize: 14, color: "var(--pv-text-mid)", lineHeight: 1.8, marginBottom: 48, fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  links: { display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  footer: {
    borderTop: "1px solid var(--pv-border)",
    padding: "28px 80px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    position: "relative", zIndex: 10,
  },
  footerName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, fontStyle: "italic", color: "rgba(199,125,255,0.4)" },
  footerCopy: { fontSize: 11, letterSpacing: "0.12em", color: "var(--pv-text-dim)", fontFamily: "'Jost', sans-serif" },
};

export default function Contact() {
  return (
    <>
      <section id="contact" style={S.section}>
        <Reveal style={S.inner}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={S.dividerLine} />
            <svg width="24" height="16" viewBox="0 0 32 22" fill="none" style={{ opacity: 0.4 }}>
              <path d="M16 11 Q14 4 6 2 Q0 1 2 8 Q4 14 16 11Z" fill="rgba(72,202,228,0.7)" />
              <path d="M16 11 Q18 4 26 2 Q32 1 30 8 Q28 14 16 11Z" fill="rgba(199,125,255,0.7)" />
            </svg>
            <div style={S.dividerLine} />
          </div>

          <div style={S.bigTitle}>
            Let&apos;s<br />
            <em style={S.bigEm}>build.</em>
          </div>

          <p style={S.sub}>
            Open to conversations about interesting problems, full-time roles after Dec 2026, or anything
            you&apos;re building that needs someone who ships.
          </p>

          <div style={S.links}>
            <a href="mailto:k.rexnath@gmail.com" className="pv-contact-link primary-link">
              Email Me
            </a>
            <a href="https://linkedin.com/in/rexellkurniawan" className="pv-contact-link" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href="https://github.com/rexellk" className="pv-contact-link" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </Reveal>
      </section>

      <footer style={S.footer}>
        <span style={S.footerName}>Rexell Kurniawan</span>
        <span style={S.footerCopy}>&copy; 2026 &nbsp;&middot;&nbsp; Built with intent</span>
      </footer>
    </>
  );
}

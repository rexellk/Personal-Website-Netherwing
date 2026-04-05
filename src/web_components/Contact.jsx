import Reveal from "./Reveal";
import { CONTACT } from "../data/portfolioData";

const S = {
  section:    { padding: "60px 80px 60px", textAlign: "center", position: "relative", zIndex: 10 },
  inner:      { maxWidth: 640, margin: "0 auto" },
  dividerLine:{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(199,125,255,0.12), transparent)" },
  bigTitle:   { fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(48px, 5vw, 50px)", color: "#fff", lineHeight: 1.0, margin: "48px 0 32px" },
  bigEm:      { fontStyle: "italic", fontWeight: 0, color: "var(--pv-lavender)" },
  sub:        { fontSize: 18, color: "var(--pv-white)", lineHeight: 1.8, marginBottom: 48, fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  links:      { display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  footer:     { borderTop: "1px solid var(--pv-border)", padding: "28px 80px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 },
  footerName: { fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 300, color: "rgba(199,125,255,0.4)", textTransform: "uppercase", letterSpacing: "0.18em" },
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
            {CONTACT.headingLine1}<br />
            <em style={S.bigEm}>{CONTACT.headingEm}</em>
          </div>

          <p style={S.sub}>{CONTACT.sub}</p>

          <div style={S.links}>
            {CONTACT.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`pv-contact-link${link.primary ? " primary-link" : ""}`}
                target={link.href.startsWith("mailto") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto") ? undefined : "noreferrer"}
              >
                {link.label}
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      <footer style={S.footer}>
        <span style={S.footerName}>{CONTACT.footerName}</span>
        <span style={S.footerCopy}>{CONTACT.footerCopy}</span>
      </footer>
    </>
  );
}

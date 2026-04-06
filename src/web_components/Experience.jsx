import Reveal from "./Reveal";
import { EXPERIENCES } from "../data/portfolioData";

const CLIP = "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)";

function CompanyIcon({ logo, initials, color, glow }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: -2, clipPath: CLIP, background: glow, filter: "blur(6px)" }} />
      <div style={{
        width: 48, height: 48, clipPath: CLIP,
        background: logo ? "rgba(0,0,0,0.5)" : `linear-gradient(135deg, ${color}18, rgba(0,0,0,0.6))`,
        border: `1px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", boxSizing: "border-box",
      }}>
        <div style={{ position: "absolute", top: 3, left: 3, width: 6, height: 1, background: color, opacity: 0.8 }} />
        <div style={{ position: "absolute", top: 3, left: 3, width: 1, height: 6, background: color, opacity: 0.8 }} />
        <div style={{ position: "absolute", bottom: 3, right: 3, width: 6, height: 1, background: color, opacity: 0.8 }} />
        <div style={{ position: "absolute", bottom: 3, right: 3, width: 1, height: 6, background: color, opacity: 0.8 }} />
        {logo
          ? <img src={logo} alt={initials} style={{ width: 36, height: 36, objectFit: "cover", clipPath: CLIP }} />
          : <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "0.1em", color }}>{initials}</span>
        }
      </div>
    </div>
  );
}

const S = {
  section:  { padding: "60px 80px 100px", position: "relative", zIndex: 10 },
  label:    { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif" },
  title:    { fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(36px, 1vw, 20px)", color: "#fff", lineHeight: 1 },
  titleEm:  { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  list:     { maxWidth: 900, margin: "30px auto 0", display: "flex", flexDirection: "column", gap: 16 },
  company:  { fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 500, color: "#fff" },
  roleText: { fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--pv-purple-light)", margin: "6px 0 14px", fontFamily: "'Jost', sans-serif" },
  period:   { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--pv-text-dim)", paddingTop: 6, fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap" },
  desc:     { fontSize: 16, lineHeight: 1.8, color: "var(--pv-text-mid)", fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  tags:     { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag:      { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, border: "1px solid var(--pv-border)", color: "var(--pv-text-dim)", fontFamily: "'Jost', sans-serif" },
};

export default function Experience() {
  return (
    <section id="experience" style={S.section}>
      <div style={{ maxWidth: 900, margin: "0 auto 0 0" }}>
        <Reveal>
          <p style={S.label}>Experience</p>
          <h2 style={S.title}>
            Where I&apos;ve<br />
            <em style={S.titleEm}>built things</em>
          </h2>
        </Reveal>
      </div>

      <div style={S.list}>
        {EXPERIENCES.map((exp, i) => {
          const inner = (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <CompanyIcon logo={exp.logo} initials={exp.initials} color={exp.iconColor} glow={exp.iconGlow} />
                  <div>
                    <div style={S.company}>{exp.company}</div>
                    <div style={S.roleText}>{exp.role}</div>
                  </div>
                </div>
                <div style={S.period}>{exp.period}</div>
              </div>
              <div style={S.desc}>{exp.desc}</div>
              <div style={S.tags}>
                {exp.tags.map((t) => (
                  <span key={t} style={S.tag}>{t}</span>
                ))}
              </div>
            </>
          );

          return (
            <Reveal key={exp.company} delay={i * 0.1 + 0.1}>
              {exp.link ? (
                <a
                  href={exp.link} target="_blank" rel="noreferrer"
                  className="pv-exp-item"
                  style={{ display: "block", textDecoration: "none", cursor: "pointer" }}
                >
                  {inner}
                </a>
              ) : (
                <div className="pv-exp-item">{inner}</div>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

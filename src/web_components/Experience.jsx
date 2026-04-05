import Reveal from "./Reveal";
import amazonLogo from "../images/amazon-logo.jpg";
import desaiLogo from "../images/desai-logo.jpeg";
import permiasLogo from "../images/permias-logo.jpeg";



const experiences = [
  {
    company: "Amazon Eero",
    role: "Software Developer Engineer Intern · iOS",
    period: "May – Aug 2026 · San Francisco",
    desc: "Joining the eero iOS team in SOMA San Francisco. Building features for the home networking app used by millions. Swift, TCA architecture, SwiftUI. Deep-diving into consumer iOS product at scale.",
    tags: ["Swift", "SwiftUI", "TCA", "iOS"],
    logo: amazonLogo,
    initials: "AE",
    iconColor: "#ff9900",
    iconGlow: "rgba(255,153,0,0.35)",
  },
  {
    company: "Desai Accelerator",
    role: "Software Engineer Intern",
    period: "May – Aug 2025 · Ann Arbor",
    desc: "Shipped production-ready features for five early-stage startups in under three weeks each: a React Native cross-cultural e-commerce MVP (50+ beta users, 4.5/5 rating), an 80% faster Algolia search engine (2.5s → 0.5s), a Bluetooth/Wi-Fi Kotlin module for an AI wellness platform, and power management code for 48V LFP battery systems.",
    tags: ["React Native", "TypeScript", "GraphQL", "Kotlin", "GCP", "Embedded C"],
    logo: desaiLogo,          // e.g. "/logos/desai.png"
    initials: "DA",
    iconColor: "#c77dff",
    iconGlow: "rgba(199,125,255,0.35)",
  },
  {
    company: "PERMIAS Nasional",
    role: "Website Developer · Technical Lead",
    period: "Nov 2024 – Present",
    desc: "Led a team of three to rebuild the national Indonesian student org website (8,000+ users, 80+ sub-orgs) from TypeDream to a custom Astro + React stack. Cut annual costs 100% ($240 → $0), reduced manual data entry 80%, increased engagement 30% in the first month.",
    tags: ["Astro", "React", "Tailwind", "Airtable", "Firebase"],
    logo: permiasLogo,          // e.g. "/logos/permias.png"
    initials: "PN",
    iconColor: "#48cae4",
    iconGlow: "rgba(72,202,228,0.35)",
  },
];

// Gamey hexagon-ish clip path — octagon with cut corners
const CLIP = "polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)";

function CompanyIcon({ logo, initials, color, glow }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Glow layer behind */}
      <div style={{
        position: "absolute", inset: -2,
        clipPath: CLIP,
        background: glow,
        filter: "blur(6px)",
      }} />
      {/* Icon face */}
      <div style={{
        width: 48, height: 48,
        clipPath: CLIP,
        background: logo ? "rgba(0,0,0,0.5)" : `linear-gradient(135deg, ${color}18, rgba(0,0,0,0.6))`,
        border: `1px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        boxSizing: "border-box",
      }}>
        {/* Corner accent ticks */}
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
  section: { padding: "60px 80px 100px", position: "relative", zIndex: 10 },
  label: { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif" },
  title: { fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(36px, 1vw, 20px)", color: "#fff", lineHeight: 1 },
  titleEm: { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  list: { maxWidth: 900, margin: "30px auto 0", display: "flex", flexDirection: "column", gap: 16 },
  company: { fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 500, color: "#fff" },
  roleText: { fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--pv-purple-light)", margin: "6px 0 14px", fontFamily: "'Jost', sans-serif" },
  period: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--pv-text-dim)", paddingTop: 6, fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap" },
  desc: { fontSize: 14, lineHeight: 1.8, color: "var(--pv-text-mid)", fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  tags: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, border: "1px solid var(--pv-border)", color: "var(--pv-text-dim)", fontFamily: "'Jost', sans-serif" },
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
        {experiences.map((exp, i) => (
          <Reveal key={exp.company} delay={i * 0.1 + 0.1}>
            <div className="pv-exp-item">
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
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

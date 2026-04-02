import Reveal from "./Reveal";

const experiences = [
  {
    company: "Amazon — eero",
    role: "SDE Intern · iOS",
    period: "May – Aug 2026 · San Francisco",
    desc: "Joining the eero iOS team in SOMA. Building features for the home networking app used by millions. Swift, TCA architecture, SwiftUI. Deep-diving into consumer iOS product at scale.",
    tags: ["Swift", "SwiftUI", "TCA", "iOS"],
    badge: { label: "May 2026", style: { background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.25)", color: "rgba(255,152,0,0.8)" } },
  },
  {
    company: "Desai Accelerator",
    role: "Software Engineer Intern",
    period: "May – Aug 2025 · Ann Arbor",
    desc: "Shipped production-ready features for five early-stage startups in under three weeks each: a React Native cross-cultural e-commerce MVP (50+ beta users, 4.5/5 rating), an 80% faster Algolia search engine (2.5s → 0.5s), a Bluetooth/Wi-Fi Kotlin module for an AI wellness platform, and power management code for 48V LFP battery systems.",
    tags: ["React Native", "TypeScript", "GraphQL", "Kotlin", "GCP", "Embedded C"],
    badge: null,
  },
  {
    company: "PERMIAS Nasional",
    role: "Website Developer · Technical Lead",
    period: "Nov 2024 – Present",
    desc: "Led a team of three to rebuild the national Indonesian student org website (8,000+ users, 80+ sub-orgs) from TypeDream to a custom Astro + React stack. Cut annual costs 100% ($240 → $0), reduced manual data entry 80%, increased engagement 30% in the first month.",
    tags: ["Astro", "React", "Tailwind", "Airtable", "Firebase"],
    badge: null,
  },
];

const S = {
  section: { padding: "60px 80px 100px", position: "relative", zIndex: 10 },
  label: { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif" },
  title: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "clamp(36px, 5vw, 58px)", color: "#fff", lineHeight: 1 },
  titleEm: { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  list: { maxWidth: 900, margin: "60px auto 0", display: "flex", flexDirection: "column", gap: 16 },
  badge: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, fontFamily: "'Jost', sans-serif" },
  company: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#fff" },
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
              {exp.badge && (
                <div style={{ position: "absolute", top: 32, right: 36 }}>
                  <span style={{ ...S.badge, ...exp.badge.style }}>{exp.badge.label}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div>
                  <div style={S.company}>{exp.company}</div>
                  <div style={S.roleText}>{exp.role}</div>
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

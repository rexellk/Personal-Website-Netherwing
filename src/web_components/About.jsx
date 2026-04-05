import Reveal from "./Reveal";

const stats = [
  { num: "5", sup: "+", label: "Startups shipped" },
  { num: "8k", sup: "+", label: "Users served" },
  { num: "80", sup: "%", label: "Search latency cut" },
  { num: "3.56", sup: "", label: "GPA · UMich CS" },
];

const coreStack = ["C++", "Python", "TypeScript", "React", "Swift / SwiftUI", "Kotlin", "SQL"];
const tools = ["Node.js", "Supabase", "FastAPI", "Docker", "AWS / GCP", "GraphQL", "PyTorch", "Three.js"];

const S = {
  section: {
    padding: "100px 80px", position: "relative", zIndex: 10
  },
  header: {
    maxWidth: 900, margin: "0 auto 0 0"
  },
  label: {
    fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif"
  },
  title: { 
    fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(36px, 1vw, 20px)", color: "#fff", lineHeight: 1 
  },
  titleEm: {
     fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" 
  },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "stretch", marginTop: 30
  },
  bodyText: {
    fontSize: 18, lineHeight: 1.9, color: "var(--pv-white)", fontFamily: "'Jost', sans-serif", fontWeight: 300 
  },
  statGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch", height: "100%"
  },
  statCard: {
    display: "flex", flexDirection: "column", justifyContent: "center"
  },
  statNum: {
    fontFamily: "'Jost', serif", fontSize: 42, fontWeight: 300, color: "#fff", lineHeight: 1
  },
  statSup: {
    fontSize: 24, color: "var(--pv-lavender)"
  },
  statLabel: {
    fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginTop: 6, fontFamily: "'Jost', sans-serif"
  },
  skillsWrap: {
    marginTop: 64
  },
  groupLabel: {
    fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginTop: 28, marginBottom: 8, fontFamily: "'Jost', sans-serif"
  },
  skillRow: {
    display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8
  },
};

export default function About() {
  return (
    <section id="about" style={S.section}>
      <Reveal style={S.header}>
        <p style={S.label}>About me</p>
        <h2 style={S.title}>
          Engineer with<br />
          <em style={S.titleEm}>business instinct</em>
        </h2>
      </Reveal>

      <div style={S.grid}>
        <Reveal delay={0.1}>
          <div style={S.bodyText}>
            <p>
              CS student at <strong style={{ color: "var(--pv-lavender)", fontWeight: 400 }}>University of Michigan</strong> (Dec 2026),
              incoming <strong style={{ color: "var(--pv-lavender)", fontWeight: 400 }}>Amazon SDE intern</strong> on the eero iOS team in San Francisco.
              I build things that ship, from production features at five early-stage startups to a national website serving 8,000+ students.
            </p>
            <p style={{ marginTop: 20 }}>
              I moved from Indonesia to Seattle at 16 and found software as the intersection of everything I love:
              systems thinking, building for real people, and the compounding nature of good ideas.
            </p>
            <p style={{ marginTop: 20 }}>
              My edge is being equally comfortable in a founder conversation and a code review.
              Startup speed, engineering craft,{" "}
              <strong style={{ color: "var(--pv-lavender)", fontWeight: 400 }}>no separation between the two.</strong>
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div style={S.statGrid}>
            {stats.map((s) => (
              <div key={s.label} className="pv-stat-card" style={S.statCard}>
                <div style={S.statNum}>
                  {s.num}
                  {s.sup && <span style={S.statSup}>{s.sup}</span>}
                </div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} style={S.skillsWrap}>
        <p style={S.groupLabel}>Core stack</p>
        <div style={S.skillRow}>
          {coreStack.map((s) => (
            <span key={s} className="pv-skill-tag">{s}</span>
          ))}
        </div>
        <p style={S.groupLabel}>Frameworks &amp; tools</p>
        <div style={S.skillRow}>
          {tools.map((s) => (
            <span key={s} className="pv-skill-tag accent">{s}</span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

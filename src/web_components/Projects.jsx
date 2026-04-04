import Reveal from "./Reveal";

const projects = [
  {
    num: "01",
    featured: true,
    name: "PERMIAS Nasional",
    desc: "Complete rebuild of Indonesia's national student org website. Migrated 8,000+ users from a paid platform to a free, custom-built stack with automated data pipelines and form handling.",
    metrics: ["30% engagement", "80% less manual work", "$240/yr saved"],
    stack: ["Astro", "React TS", "Tailwind", "Airtable", "Firebase", "GitHub Pages"],
  },
  {
    num: "02",
    name: "MailMind",
    desc: "AI-powered email sorter using Gmail API and GPT-3.5. Real-time dashboard analytics, smart priority filtering, and Supabase auth.",
    metrics: ["80% inbox automated", "60% less nav time"],
    stack: ["React", "Supabase", "PostgreSQL", "GPT-3.5"],
  },
  {
    num: "03",
    name: "Cross-Cultural E-Commerce MVP",
    desc: "iOS/Android furnishing app for a non-English-speaking founder. Full RESTful backend, headless e-commerce, shipped in under three weeks.",
    metrics: ["50 beta users", "4.5/5 rating"],
    stack: ["React Native", "Expo", "PostgreSQL", "GCP"],
  },
  {
    num: "04",
    name: "Euchre AI",
    desc: "C++ implementation of Euchre with a Bayesian inference AI opponent. 30% higher win rate vs baseline bots using strategic heuristics.",
    metrics: ["30% better win rate"],
    stack: ["C++", "Bayesian inference", "Game theory"],
  },
  {
    num: "05",
    name: "REVO",
    desc: "Automotive marketplace startup co-founded and piloting in Ann Arbor. Built customer-facing onboarding, mechanic portal, and welcome flows.",
    metrics: ["Actively piloting"],
    stack: ["React", "Startup"],
  },
];

const S = {
  section: { padding: "60px 80px 40px", position: "relative", zIndex: 10 },
  label: { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif" },
  title: { fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(36px, 1vw, 20px)", color: "#fff", lineHeight: 1 },
  titleEm: { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 30, maxWidth: 1100, margin: "30px auto 0" },
  num: { fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "rgba(199,125,255,0.35)", letterSpacing: "0.12em", marginBottom: 16 },
  name: { fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 500, color: "#fff", lineHeight: 1.1, marginBottom: 12 },
  desc: { fontSize: 13, lineHeight: 1.8, color: "var(--pv-text-mid)", marginBottom: 20, fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  metrics: { display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 },
  metric: { fontSize: 11, color: "var(--pv-blue)", letterSpacing: "0.06em", fontFamily: "'Jost', sans-serif" },
  stack: { display: "flex", flexWrap: "wrap", gap: 7 },
  stackTag: { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(199,125,255,0.14)", color: "rgba(199,125,255,0.5)", fontFamily: "'Jost', sans-serif" },
  featuredInner: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" },
  featuredVisual: {
    height: 200, borderRadius: 12,
    background: "linear-gradient(135deg, rgba(123,47,190,0.3), rgba(72,202,228,0.1))",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid rgba(199,125,255,0.12)",
    fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: "rgba(199,125,255,0.2)",
  },
};

function ProjectCard({ project, delay }) {
  if (project.featured) {
    return (
      <Reveal delay={delay} style={{ gridColumn: "span 2" }}>
        <div className="pv-project-card" style={{ gridColumn: "span 2" }}>
          <div style={S.featuredInner}>
            <div>
              <div style={S.num}>{project.num} — Featured</div>
              <div style={S.name}>{project.name}</div>
              <div style={S.desc}>{project.desc}</div>
              <div style={S.metrics}>
                {project.metrics.map((m) => (
                  <span key={m} style={S.metric}>+{m}</span>
                ))}
              </div>
              <div style={S.stack}>
                {project.stack.map((t) => (
                  <span key={t} style={S.stackTag}>{t}</span>
                ))}
              </div>
            </div>
            <div style={S.featuredVisual}>&#x2609;</div>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal delay={delay}>
      <div className="pv-project-card">
        <div style={S.num}>{project.num}</div>
        <div style={S.name}>{project.name}</div>
        <div style={S.desc}>{project.desc}</div>
        <div style={S.metrics}>
          {project.metrics.map((m) => (
            <span key={m} style={S.metric}>+{m}</span>
          ))}
        </div>
        <div style={S.stack}>
          {project.stack.map((t) => (
            <span key={t} style={S.stackTag}>{t}</span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export default function Projects() {
  return (
    <section id="projects" style={S.section}>
      <Reveal>
        <p style={S.label}>Selected projects</p>
        <h2 style={S.title}>
          Things I&apos;ve<br />
          <em style={S.titleEm}>built &amp; shipped</em>
        </h2>
      </Reveal>

      <div style={S.grid}>
        {projects.map((p, i) => (
          <ProjectCard key={p.num} project={p} delay={i * 0.1 + 0.1} />
        ))}
      </div>
    </section>
  );
}

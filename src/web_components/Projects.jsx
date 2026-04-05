import { useState } from "react";
import Reveal from "./Reveal";
import { PROJECTS } from "../data/portfolioData";
import { ExternalLink } from "lucide-react";

const S = {
  section:       { padding: "60px 80px 40px", position: "relative", zIndex: 10 },
  label:         { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif" },
  title:         { fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(36px, 1vw, 20px)", color: "#fff", lineHeight: 1 },
  titleEm:       { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  num:           { fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "rgba(199,125,255,0.35)", letterSpacing: "0.12em", marginBottom: 16 },
  name:          { fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 500, color: "#fff", lineHeight: 1.1, marginBottom: 12 },
  desc:          { fontSize: 13, lineHeight: 1.8, color: "var(--pv-text-mid)", marginBottom: 20, fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  metrics:       { display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 },
  metric:        { fontSize: 11, color: "var(--pv-blue)", letterSpacing: "0.06em", fontFamily: "'Jost', sans-serif" },
  stack:         { display: "flex", flexWrap: "wrap", gap: 7 },
  stackTag:      { fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(199,125,255,0.14)", color: "rgba(199,125,255,0.5)", fontFamily: "'Jost', sans-serif" },
  featuredInner: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" },
  featuredVisual: {
    height: 200, borderRadius: 12,
    background: "linear-gradient(135deg, rgba(123,47,190,0.3), rgba(72,202,228,0.1))",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid rgba(199,125,255,0.12)",
    overflow: "hidden",
    fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: "rgba(199,125,255,0.2)",
  },
};

function FeaturedVisual({ project, hovered, setHovered }) {

  const base = {
    ...S.featuredVisual,
    position: "relative",
    textDecoration: "none",
    display: "block",
    cursor: project.link ? "pointer" : "default",
    overflow: "hidden",
  };

  const content = (
    <>
      {project.image ? (
        <img
          src={project.image}
          alt={project.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.03)" : "scale(1)",
            transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      ) : (
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: "rgba(199,125,255,0.2)" }}>&#x2609;</span>
      )}

      {project.link && (
        <>
          {/* Dim overlay on hover */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(3,0,10,0.45)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.35s ease",
          }} />

          {/* Badge */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(3,0,10,0.82)", backdropFilter: "blur(10px)",
            border: `1px solid ${hovered ? "rgba(199,125,255,0.6)" : "rgba(199,125,255,0.25)"}`,
            borderRadius: 8, padding: "5px 10px",
            display: "flex", alignItems: "center", gap: 6,
            color: hovered ? "rgba(224,170,255,1)" : "rgba(199,125,255,0.7)",
            fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
            fontFamily: "'Jost', sans-serif",
            boxShadow: hovered ? "0 0 16px rgba(199,125,255,0.35)" : "none",
            transition: "border-color 0.3s, color 0.3s, box-shadow 0.3s",
          }}>
            <ExternalLink
              size={11}
              strokeWidth={2}
              style={{
                transform: hovered ? "translate(2px, -2px)" : "translate(0,0)",
                transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>

          {/* Corner glow sweep on hover */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(199,125,255,0.18), transparent 70%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }} />
        </>
      )}
    </>
  );

  if (project.link) {
    return (
      <a href={project.link} target="_blank" rel="noreferrer" style={base}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {content}
      </a>
    );
  }
  return <div style={base}>{content}</div>;
}

function ProjectCard({ project, index, spanFull }) {
  const [hovered, setHovered] = useState(false);
  const num = String(index + 1).padStart(2, "0");

  if (project.featured) {
    return (
      <Reveal delay={index * 0.1 + 0.1} style={{ gridColumn: "1 / -1" }}>
        <div className="pv-project-card">
          <div style={S.featuredInner}>
            <div style={{
              transform: hovered ? "translateX(-6px)" : "translateX(0)",
              transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
            }}>
              <div style={S.num}>{num} — Featured</div>
              <div style={{
                ...S.name,
                color: hovered ? "var(--pv-lavender)" : "#fff",
                transition: "color 0.3s ease",
              }}>{project.name}</div>
              <div style={S.desc}>{project.desc}</div>
              <div style={S.metrics}>
                {project.metrics.map((m) => <span key={m} style={S.metric}>+{m}</span>)}
              </div>
              <div style={S.stack}>
                {project.stack.map((t) => <span key={t} style={S.stackTag}>{t}</span>)}
              </div>
            </div>
            <FeaturedVisual project={project} hovered={hovered} setHovered={setHovered} />
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal delay={index * 0.1 + 0.1} style={spanFull ? { gridColumn: "1 / -1" } : {}}>
      <div className="pv-project-card" style={spanFull ? { maxWidth: "50%", margin: "0 auto", width: "100%" } : {}}>
        <div style={S.num}>{num}</div>
        <div style={S.name}>{project.name}</div>
        <div style={S.desc}>{project.desc}</div>
        <div style={S.metrics}>
          {project.metrics.map((m) => <span key={m} style={S.metric}>+{m}</span>)}
        </div>
        <div style={S.stack}>
          {project.stack.map((t) => <span key={t} style={S.stackTag}>{t}</span>)}
        </div>
      </div>
    </Reveal>
  );
}

export default function Projects() {
  // Determine which regular (non-featured) cards are orphans (last card in an odd-count row)
  const regularProjects = PROJECTS.filter(p => !p.featured);
  const orphanIndex = regularProjects.length % 2 !== 0 ? regularProjects.length - 1 : -1;

  // Rebuild flat list with orphan awareness
  let regularCount = 0;

  return (
    <section id="projects" style={S.section}>
      <Reveal>
        <p style={S.label}>Selected projects</p>
        <h2 style={S.title}>
          Things I&apos;ve<br />
          <em style={S.titleEm}>built &amp; shipped</em>
        </h2>
      </Reveal>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 20,
        marginTop: 30,
        maxWidth: 1100,
        margin: "30px auto 0",
      }}>
        {PROJECTS.map((p, i) => {
          const isOrphan = !p.featured && regularCount === orphanIndex;
          if (!p.featured) regularCount++;
          return (
            <ProjectCard
              key={p.name}
              project={p}
              index={i}
              spanFull={isOrphan}
            />
          );
        })}
      </div>
    </section>
  );
}

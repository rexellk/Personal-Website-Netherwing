import Reveal from "./Reveal";
import { EXPERIENCES } from "../data/portfolioData";

function CompanyMark({ logo, initials, color }) {
  if (logo) return <img src={logo} alt="" className="pv-exp-logo" />;
  return (
    <span
      className="pv-exp-logo"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--pv-body)", fontSize: 13, fontWeight: 500, color,
      }}
    >
      {initials}
    </span>
  );
}

function ExperienceRow({ exp }) {
  // "May – Aug 2026 · San Francisco" → date on one line, place below
  const [when, ...where] = exp.period.split(" · ");

  const inner = (
    <>
      <div className="pv-exp-when">
        {when}
        {where.length > 0 && <span>{where.join(", ")}</span>}
      </div>
      <div>
        <div className="pv-exp-head">
          <CompanyMark logo={exp.logo} initials={exp.initials} color={exp.iconColor} />
          <div style={{ flex: 1 }}>
            <div className="pv-exp-company">{exp.company}</div>
            <div className="pv-exp-role">{exp.role.replaceAll(" · ", ", ")}</div>
          </div>
        </div>
        <p className="pv-exp-desc">{exp.desc}</p>
        <div className="pv-meta">
          {exp.tags.map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>
    </>
  );

  return exp.link ? (
    <a href={exp.link} target="_blank" rel="noreferrer" className="pv-exp-item">{inner}</a>
  ) : (
    <div className="pv-exp-item">{inner}</div>
  );
}

export default function Experience() {
  return (
    <section id="experience" className="pv-section">
      <div className="pv-section-head">
        <Reveal>
          <h2 className="pv-section-title">Where I&apos;ve built things</h2>
        </Reveal>
      </div>

      <div className="pv-ledger">
        {EXPERIENCES.map((exp, i) => (
          <Reveal key={exp.company} delay={i * 0.1 + 0.1}>
            <ExperienceRow exp={exp} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

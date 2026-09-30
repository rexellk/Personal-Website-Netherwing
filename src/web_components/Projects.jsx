import Reveal from "./Reveal";
import { PROJECTS } from "../data/portfolioData";

// Wraps content in a link when the project has one, otherwise a plain block
function MaybeLink({ href, className, children }) {
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>
  ) : (
    <div className={className}>{children}</div>
  );
}

function ProjectText({ project }) {
  return (
    <>
      <div className="pv-project-name">
        {project.name}
      </div>
      <p className="pv-project-desc">{project.desc}</p>
      {project.metrics?.length > 0 && (
        <div className="pv-metrics">
          {project.metrics.map((m) => <span key={m}>{m}</span>)}
        </div>
      )}
      <div className="pv-meta">
        {project.stack.map((t) => <span key={t}>{t}</span>)}
      </div>
    </>
  );
}

function FeaturedProject({ project, flip }) {
  return (
    <MaybeLink href={project.link} className={`pv-project${flip ? " flip" : ""}`}>
      <div className="pv-project-text">
        <ProjectText project={project} />
      </div>
      <div className="pv-project-frame">
        {project.image
          ? <img src={project.image} alt={`${project.name} website`} loading="lazy" />
          : <div style={{ aspectRatio: "16 / 9", background: "var(--pv-dusk)" }} />
        }
      </div>
    </MaybeLink>
  );
}

export default function Projects() {
  const featured = PROJECTS.filter((p) => p.featured);
  const regular = PROJECTS.filter((p) => !p.featured);

  return (
    <section id="projects" className="pv-section">
      <div className="pv-section-head">
        <Reveal>
          <h2 className="pv-section-title">Things I&apos;ve built and shipped</h2>
        </Reveal>
      </div>

      <div>
        {featured.map((p, i) => (
          <Reveal key={p.name} delay={0.1}>
            <FeaturedProject project={p} flip={i % 2 === 1} />
          </Reveal>
        ))}

        {regular.length > 0 && (
          <>
            <Reveal>
              <h3 className="pv-project-grid-title">Smaller projects</h3>
            </Reveal>
            <div className="pv-project-grid">
              {regular.map((p, i) => (
                <Reveal key={p.name} delay={(i % 2) * 0.1}>
                  <MaybeLink href={p.link} className="pv-project-row">
                    <ProjectText project={p} />
                  </MaybeLink>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

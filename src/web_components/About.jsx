import { useState } from "react";
import Reveal from "./Reveal";
import { ABOUT } from "../data/portfolioData";
import michiganM from "../images/michigan-m.webp";

// Renders a string with <strong>text</strong> tags safely as JSX — no dangerouslySetInnerHTML
function RichText({ text }) {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<strong>(.*?)<\/strong>$/);
    return match ? <strong key={i}>{match[1]}</strong> : part;
  });
}

// Arched portrait window, framed like Castorice's display case
function Reliquary() {
  const [hoverM, setHoverM] = useState(false);

  return (
    <div className="pv-reliquary">
      <span className="pv-reliquary-bead" aria-hidden="true" />
      <div className="pv-reliquary-window">
        <img src={ABOUT.profileImage} alt="Rexell Kurniawan" />
      </div>

      {/* Block M — kept from the original, tucked at the frame's foot */}
      <img
        src={michiganM}
        alt=""
        onMouseEnter={() => setHoverM(true)}
        onMouseLeave={() => setHoverM(false)}
        style={{
          position: "absolute",
          bottom: -16,
          right: -26,
          width: 46,
          height: "auto",
          transform: hoverM ? "rotate(-9deg) scale(1.15)" : "rotate(-9deg)",
          transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
          filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.55))",
          userSelect: "none",
        }}
      />
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="pv-section">
      <div className="pv-section-head">
        <Reveal>
          <h2 className="pv-section-title">
            {ABOUT.headingLine1} {ABOUT.headingEm}
          </h2>
          <Reliquary />
        </Reveal>
      </div>

      <div>
        <Reveal delay={0.1}>
          <div className="pv-body">
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i}><RichText text={p} /></p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="pv-skill-groups">
            <span className="pv-skill-label">Languages</span>
            <div className="pv-skill-list">
              {ABOUT.coreStack.map((s) => <span key={s}>{s}</span>)}
            </div>
            <span className="pv-skill-label">Frameworks &amp; tools</span>
            <div className="pv-skill-list">
              {ABOUT.tools.map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

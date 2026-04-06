import { useState } from "react";
import Reveal from "./Reveal";
import { ABOUT } from "../data/portfolioData";
import michiganM from "../images/michigan-m.webp";

// Renders a string with <strong>text</strong> tags safely as JSX — no dangerouslySetInnerHTML
function RichText({ text }) {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return parts.map((part, i) => {
    const match = part.match(/^<strong>(.*?)<\/strong>$/);
    return match
      ? <strong key={i} style={{ color: "var(--pv-lavender)", fontWeight: 400 }}>{match[1]}</strong>
      : part;
  });
}

const S = {
  section:    { padding: "100px 80px", position: "relative", zIndex: 10 },
  header:     { maxWidth: 900, margin: "0 auto 0 0" },
  label:      { fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginBottom: 10, fontFamily: "'Jost', sans-serif" },
  title:      { fontFamily: "'Xirod', serif", fontWeight: 0, fontSize: "clamp(36px, 1vw, 20px)", color: "#fff", lineHeight: 1 },
  titleEm:    { fontStyle: "italic", fontWeight: 300, color: "var(--pv-lavender)" },
  grid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", marginTop: 30 },
  bodyText:   { fontSize: 18, lineHeight: 1.9, color: "var(--pv-white)", fontFamily: "'Jost', sans-serif", fontWeight: 300 },
  skillsWrap: { marginTop: 64 },
  groupLabel: { fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--pv-text-dim)", marginTop: 28, marginBottom: 8, fontFamily: "'Jost', sans-serif" },
  skillRow:   { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 },
};

function ProfileCircle() {
  const [hoverM1, setHoverM1] = useState(false);
  const [hoverM2, setHoverM2] = useState(false);

  return (
    <div style={{ position: "relative", width: "fit-content", margin: "0 auto" }}>
      {/* Gradient border ring */}
      <div style={{
        background: "linear-gradient(135deg, rgba(199,125,255,0.9) 0%, rgba(80,160,255,0.65) 50%, rgba(199,125,255,0.35) 100%)",
        padding: 2,
        borderRadius: "50%",
        boxShadow: "0 0 28px rgba(199,125,255,0.45), 0 0 70px rgba(199,125,255,0.12)",
      }}>
        <div style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#0c0a12",
        }}>
          <img
            src={ABOUT.profileImage}
            alt="Profile"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      {/* Block M — top right */}
      <img
        src={michiganM}
        alt=""
        onMouseEnter={() => setHoverM1(true)}
        onMouseLeave={() => setHoverM1(false)}
        style={{
          position: "absolute",
          top: -10,
          right: 300,
          width: 50,
          height: "auto",
          transform: hoverM1 ? "rotate(13deg) scale(1.18)" : "rotate(13deg)",
          transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
          filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.55))",
          userSelect: "none",
        }}
      />

      {/* Block M — bottom right */}
      <img
        src={michiganM}
        alt=""
        onMouseEnter={() => setHoverM2(true)}
        onMouseLeave={() => setHoverM2(false)}
        style={{
          position: "absolute",
          bottom: -10,
          right: -60,
          width: 58,
          height: "auto",
          transform: hoverM2 ? "rotate(-9deg) scale(1.18)" : "rotate(-9deg)",
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
    <section id="about" style={S.section}>
      <Reveal style={S.header}>
        <p style={S.label}>About me</p>
        <h2 style={S.title}>
          {ABOUT.headingLine1}<br />
          <em style={S.titleEm}>{ABOUT.headingEm}</em>
        </h2>
      </Reveal>

      <div style={S.grid}>
        <Reveal delay={0.1}>
          <div style={S.bodyText}>
            {ABOUT.paragraphs.map((p, i) => (
              <p key={i} style={{ marginTop: i === 0 ? 0 : 20 }}>
                <RichText text={p} />
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <ProfileCircle />
        </Reveal>
      </div>

      <Reveal delay={0.1} style={S.skillsWrap}>
        <p style={S.groupLabel}>Core stack</p>
        <div style={S.skillRow}>
          {ABOUT.coreStack.map((s) => (
            <span key={s} className="pv-skill-tag">{s}</span>
          ))}
        </div>
        <p style={S.groupLabel}>Frameworks &amp; tools</p>
        <div style={S.skillRow}>
          {ABOUT.tools.map((s) => (
            <span key={s} className="pv-skill-tag accent">{s}</span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

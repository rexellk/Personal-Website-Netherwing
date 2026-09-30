// Static, low-opacity night-sky layer behind the portfolio sections:
// guilloché wave bundles (sides, curling in at the top corners), tiled starfield and a few brighter glinting stars.
// No animation — the page's motion stays with the dragon, rift and butterflies.

const SPARKLES = [
  { top: "3%",  left: "88%", size: 11, o: 0.65 },
  { top: "11%", left: "46%", size: 7,  o: 0.5 },
  { top: "19%", left: "93%", size: 8,  o: 0.55 },
  { top: "31%", left: "6%",  size: 9,  o: 0.55 },
  { top: "38%", left: "52%", size: 6,  o: 0.45 },
  { top: "46%", left: "95%", size: 12, o: 0.65 },
  { top: "57%", left: "38%", size: 7,  o: 0.45 },
  { top: "64%", left: "8%",  size: 10, o: 0.55 },
  { top: "76%", left: "90%", size: 8,  o: 0.55 },
  { top: "83%", left: "12%", size: 7,  o: 0.45 },
  { top: "94%", left: "72%", size: 11, o: 0.65 },
];

function Glint({ size }) {
  return (
    <span
      style={{
        display: "block", width: size / 3, height: size / 3, borderRadius: "50%",
        background: "var(--pv-petal)",
        boxShadow: `0 0 ${size}px ${size / 4}px rgba(240,201,228,0.35)`,
      }}
    />
  );
}

export default function BackgroundAccents() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}
    >
      <div className="pv-waves">
        <div className="pv-waves-corner left" />
        <div className="pv-waves-corner right" />
      </div>
      <div className="pv-starfield" />

      {SPARKLES.map((s, i) => (
        <div key={`s${i}`} style={{ position: "absolute", top: s.top, left: s.left, opacity: s.o }}>
          <Glint size={s.size} />
        </div>
      ))}
    </div>
  );
}

export default function SectionDivider({ variant = "purple" }) {
  const colors =
    variant === "pink"
      ? ["rgba(255,179,198,0.45)", "rgba(255,179,198,0.2)", "rgba(199,125,255,0.45)", "rgba(199,125,255,0.2)"]
      : ["rgba(199,125,255,0.4)", "rgba(199,125,255,0.2)", "rgba(72,202,228,0.4)", "rgba(72,202,228,0.2)"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "60px 80px",
        position: "relative",
        zIndex: 10,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(199,125,255,0.12), transparent)" }} />
      <svg width="32" height="22" viewBox="0 0 32 22" fill="none" style={{ opacity: 0.5 }}>
        <path d={`M16 11 Q14 4 6 2 Q0 1 2 8 Q4 14 16 11Z`} fill={colors[0]} />
        <path d={`M16 11 Q18 16 10 18 Q4 19 6 14 Q8 10 16 11Z`} fill={colors[1]} />
        <path d={`M16 11 Q18 4 26 2 Q32 1 30 8 Q28 14 16 11Z`} fill={colors[2]} />
        <path d={`M16 11 Q14 16 22 18 Q28 19 26 14 Q24 10 16 11Z`} fill={colors[3]} />
        <path d="M15.5 8 Q16 11 15.5 14" stroke="rgba(199,125,255,0.5)" strokeWidth="1" fill="none" />
      </svg>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(199,125,255,0.12), transparent)" }} />
    </div>
  );
}

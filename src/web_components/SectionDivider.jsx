// Hairline + butterfly divider between sections.
// variant "pair" = small two-wing mark (as above Contact); "full" = four-wing butterfly.
export default function SectionDivider({ variant = "full" }) {
  const rule = { flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--pv-rule), transparent)" };

  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "0 96px 0 120px",
        position: "relative",
        zIndex: 10,
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <div style={rule} />
      {variant === "pair" ? (
        <svg width="28" height="19" viewBox="0 0 32 22" fill="none">
          <path d="M16 11 Q14 4 6 2 Q0 1 2 8 Q4 14 16 11Z" fill="rgba(143,120,196,0.45)" />
          <path d="M16 11 Q18 4 26 2 Q32 1 30 8 Q28 14 16 11Z" fill="rgba(201,139,230,0.55)" />
        </svg>
      ) : (
        <svg width="32" height="22" viewBox="0 0 32 22" fill="none">
          <path d="M16 11 Q14 4 6 2 Q0 1 2 8 Q4 14 16 11Z" fill="rgba(201,139,230,0.5)" />
          <path d="M16 11 Q18 16 10 18 Q4 19 6 14 Q8 10 16 11Z" fill="rgba(201,139,230,0.25)" />
          <path d="M16 11 Q18 4 26 2 Q32 1 30 8 Q28 14 16 11Z" fill="rgba(143,120,196,0.5)" />
          <path d="M16 11 Q14 16 22 18 Q28 19 26 14 Q24 10 16 11Z" fill="rgba(143,120,196,0.25)" />
          <path d="M15.5 8 Q16 11 15.5 14" stroke="rgba(240,201,228,0.5)" strokeWidth="1" fill="none" />
        </svg>
      )}
      <div style={rule} />
    </div>
  );
}

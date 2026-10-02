// Wireframe Netherwing head (traced from the logo: three swept horns a side, flared cheek
// spikes, slanted eyes, a V crest and a narrow snout) for the corner "Anim on / off" toggle.
// Same line language as MegaphoneIcon; colour and the lit-eye "on" state come from CSS
// (.pv-anim): the face lines and eye glow only show when on.
const L = [
  // outline, chin → crest notch (left half; mirrored for the right)
  "M28 54 L23.5 47.5 L19.5 40.5 L9.5 35.5 L15.8 32 L4.5 23.5 L13.6 23",
  "Q8.6 14.5 7.2 3.8 Q13.4 12.4 18.2 19.2",
  "Q16 11 17.4 2.6 Q21 10.4 23 16.4",
  "Q23 12.6 24.6 9.2 Q26.2 15.4 28 21",
].join(" ");
const R = L.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(56 - x).toFixed(1)} ${y}`);

export default function DragonHeadIcon({ height = 46 }) {
  return (
    <svg viewBox="0 0 56 56" width={height} height={height} fill="none" aria-hidden="true">
      <g className="pv-sound-body">
        <path d={L} />
        <path d={R} />
        {/* face: snout ridge, brows, nostrils (on only) */}
        <g className="pv-anim-face">
          <path d="M28 21 L28 45 M20.5 27 L26.4 31.6 M35.5 27 L29.6 31.6" />
          <path d="M25.6 47.6 L26.8 50.2 M30.4 47.6 L29.2 50.2" />
        </g>
        {/* slanted eyes */}
        <path className="pv-anim-eye" d="M17.4 30.4 L24.6 33.6 L20.4 34.6 Z" />
        <path className="pv-anim-eye" d="M38.6 30.4 L31.4 33.6 L35.6 34.6 Z" />
      </g>
    </svg>
  );
}

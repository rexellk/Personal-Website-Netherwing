import { useId } from "react";

// Wireframe megaphone drawing shared by the corner sound toggle and the hero
// prompt. Stroke color and the on/off states come from the parent's CSS
// (.pv-sound / .pv-ritual-sound): the bell web and sound arcs only show when "on".
export default function MegaphoneIcon({ width = 62 }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 76 56" width={width} height={width * 56 / 76} fill="none" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="41" cy="26" rx="6" ry="15.5" />
        </clipPath>
      </defs>
      <g className="pv-sound-body" transform="rotate(-10 30 28)">
        {/* rear cap + body */}
        <ellipse cx="9" cy="26" rx="2.6" ry="5.5" />
        <path d="M9 20.5 H19 M9 31.5 H19" />
        {/* collar ring */}
        <ellipse cx="19" cy="26" rx="2.8" ry="6.8" />
        <ellipse cx="22" cy="26" rx="2.4" ry="6.2" className="pv-sound-faint" />
        {/* cone */}
        <path d="M20 19.2 L41 10.5 M20 32.8 L41 41.5" />
        {/* inner driver seen through the glass */}
        <ellipse cx="34" cy="26" rx="3" ry="7.5" className="pv-sound-faint" />
        <path d="M26 21 L34 18.5 M26 31 L34 33.5" className="pv-sound-faint" />
        {/* bell rim */}
        <ellipse cx="41" cy="26" rx="6" ry="15.5" />
        {/* guilloché web inside the bell (on only) */}
        <g clipPath={`url(#${clipId})`} className="pv-sound-web">
          <path d="M35 12 L47 38 M36 40 L46 13 M35 22 L47 30 M35 31 L47 20 M38 10 L44 42" />
        </g>
        {/* handle */}
        <path d="M14 31.5 L12.5 43 Q12.3 45.5 14.8 45.5 H17.6 Q19.8 45.5 19.6 43 L19.2 32.6" />
        <path d="M19.4 36 H21.4 V40 H19.5" className="pv-sound-faint" />
      </g>
      {/* sound arcs (on only) */}
      <g className="pv-sound-arcs" transform="rotate(-10 30 28)">
        <path d="M52 17 Q57.5 26 52 35" style={{ transitionDelay: "0s" }} />
        <path d="M57.5 12 Q65 26 57.5 40" style={{ transitionDelay: "0.08s" }} />
        <path d="M63 7 Q72.5 26 63 45" style={{ transitionDelay: "0.16s" }} />
      </g>
    </svg>
  );
}

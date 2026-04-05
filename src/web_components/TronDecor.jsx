import { useEffect, useRef, useState } from "react"

// Branch nodes at fractional positions along the spine (0 = top, 1 = bottom)
const NODES = [
  { frac: 0.08, color: "rgba(199,125,255,0.9)", label: "INIT" },
  { frac: 0.22, color: "rgba(72,202,228,0.9)",  label: "ABOUT" },
  { frac: 0.38, color: "rgba(199,125,255,0.9)", label: "EXP" },
  { frac: 0.55, color: "rgba(72,202,228,0.9)",  label: "PROJ" },
  { frac: 0.72, color: "rgba(199,125,255,0.9)", label: "STACK" },
  { frac: 0.90, color: "rgba(72,202,228,0.9)",  label: "END" },
]

const css = `
  @keyframes tron-cursor-pulse {
    0%, 100% { opacity: 1;   filter: drop-shadow(0 0 4px rgba(199,125,255,1)); }
    50%       { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(199,125,255,0.4)); }
  }
  @keyframes tron-node-arrive {
    0%   { r: 2; opacity: 0.4; }
    40%  { r: 5; opacity: 1; }
    100% { r: 3; opacity: 1; }
  }
  @keyframes tron-branch-in {
    from { stroke-dashoffset: 80; opacity: 0; }
    to   { stroke-dashoffset: 0;  opacity: 1; }
  }
  .tron-cursor-dot {
    animation: tron-cursor-pulse 1.4s ease-in-out infinite;
  }
`

const W       = 72   // SVG width
const SPINE_X = 28   // x of the vertical spine
const BRANCH_LEN = 36 // how far the horizontal branch extends right

export default function TronDecor() {
  const [progress, setProgress] = useState(0)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const targetRef = useRef(0)
  const currentRef = useRef(0)

  useEffect(() => {
    function calcProgress() {
      const el = containerRef.current?.parentElement
      if (!el) return 0
      const rect = el.getBoundingClientRect()
      const total = el.scrollHeight - window.innerHeight
      if (total <= 0) return 0
      // how far into the section wrapper we've scrolled
      const scrolled = Math.max(0, -rect.top)
      return Math.min(1, scrolled / total)
    }

    function onScroll() {
      targetRef.current = calcProgress()
    }

    function tick() {
      // smooth lerp toward target
      currentRef.current += (targetRef.current - currentRef.current) * 0.08
      setProgress(currentRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const H = 100 // viewBox height (%)
  // We work in a viewBox where height = 1000 for precision
  const VH = 1000
  const fillY = progress * VH

  return (
    <>
      <style>{css}</style>
      <div
        ref={containerRef}
        style={{
          position: "absolute", inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        <svg
          width={W}
          height="100%"
          viewBox={`0 0 ${W} ${VH}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", left: 0, top: 0, height: "100%", display: "block" }}
        >
          {/* Ghost spine — full height, always visible */}
          <line
            x1={SPINE_X} y1={0} x2={SPINE_X} y2={VH}
            stroke="rgba(199,125,255,0.1)" strokeWidth="1"
          />

          {/* Progress fill — grows downward as you scroll */}
          <line
            x1={SPINE_X} y1={0} x2={SPINE_X} y2={fillY}
            stroke="rgba(199,125,255,0.55)" strokeWidth="1.5"
          />
          {/* Bright glow copy on top */}
          <line
            x1={SPINE_X} y1={0} x2={SPINE_X} y2={fillY}
            stroke="rgba(199,125,255,0.2)" strokeWidth="4"
          />

          {/* Branch nodes + horizontal stubs */}
          {NODES.map((node, i) => {
            const ny = node.frac * VH
            const arrived = progress >= node.frac
            const alpha = arrived ? 1 : 0.12
            const branchColor = arrived ? node.color : "rgba(199,125,255,0.1)"
            const bx2 = SPINE_X + BRANCH_LEN

            return (
              <g key={i}>
                {/* Ghost branch */}
                <line
                  x1={SPINE_X} y1={ny} x2={bx2} y2={ny}
                  stroke="rgba(199,125,255,0.07)" strokeWidth="1"
                />
                {/* Lit branch */}
                {arrived && (
                  <line
                    x1={SPINE_X} y1={ny} x2={bx2} y2={ny}
                    stroke={node.color}
                    strokeWidth="1"
                    strokeDasharray="80"
                    strokeDashoffset="0"
                    opacity="0.7"
                    style={{ animation: "tron-branch-in 0.4s ease forwards" }}
                  />
                )}
                {/* End tick on branch */}
                {arrived && (
                  <line
                    x1={bx2} y1={ny - 6} x2={bx2} y2={ny + 6}
                    stroke={node.color} strokeWidth="1" opacity="0.6"
                  />
                )}
                {/* Node circle */}
                <circle
                  cx={SPINE_X} cy={ny} r={arrived ? 3 : 2}
                  fill={arrived ? node.color : "rgba(199,125,255,0.15)"}
                  style={{
                    filter: arrived ? `drop-shadow(0 0 4px ${node.color})` : "none",
                    transition: "r 0.3s, fill 0.3s, filter 0.3s",
                  }}
                />
              </g>
            )
          })}

          {/* Cursor dot — travels at the tip of the fill */}
          {progress > 0.01 && progress < 0.995 && (
            <circle
              cx={SPINE_X} cy={fillY} r={3.5}
              fill="rgba(255,255,255,0.9)"
              className="tron-cursor-dot"
            />
          )}
        </svg>
      </div>
    </>
  )
}

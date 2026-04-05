import { useState, useEffect, useRef } from 'react'

const LINES = [
  <>INIT <span style={{ color: '#4fc3f7' }}>SYSTEM_BOOT</span> ...</>,
  <>LOADING <span style={{ color: '#4fc3f7' }}>KERNEL</span> ...</>,
  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>CONJURING <span style={{ color: '#ab47bc' }}>NETHERWING</span><img src="/Netherwing_Logo.PNG" alt="" style={{ height: '1.4em', filter: 'drop-shadow(0 0 6px rgba(171,71,188,0.9)) drop-shadow(0 0 14px rgba(171,71,188,0.5))' }} />[OK]</span>,
  <>ESTABLISHING <span style={{ color: '#4fc3f7' }}>CONNECTION</span> ...</>,
  <>WELCOME, <span style={{ color: '#4fc3f7' }}>GUEST</span>.</>,
  <>&gt; ACCESS GRANTED <span className="ls-cursor" /></>,
]

const STAGGER_MS  = 700
const HOLD_MS     = 900
const FADEOUT_MS  = 800

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap');

  @keyframes ls-fadeInLine {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes ls-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  .ls-cursor {
    display: inline-block;
    width: 9px;
    height: 1.1em;
    background: #fff;
    vertical-align: text-bottom;
    margin-left: 4px;
    animation: ls-blink 1s step-end infinite;
  }

  .ls-line {
    opacity: 0;
    animation: ls-fadeInLine 0.3s ease forwards;
  }
`

export default function LoadingScreen({ onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [fading, setFading] = useState(false)
  const [done, setDone] = useState(false)
  const timerRefs = useRef([])
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    // Stagger lines in — runs once on mount only
    LINES.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleCount(i + 1)

        // After last line, wait then fade out
        if (i === LINES.length - 1) {
          const hold = setTimeout(() => {
            setFading(true)
            const fade = setTimeout(() => {
              setDone(true)
              onCompleteRef.current?.()
            }, FADEOUT_MS)
            timerRefs.current.push(fade)
          }, HOLD_MS)
          timerRefs.current.push(hold)
        }
      }, STAGGER_MS * (i + 1))
      timerRefs.current.push(t)
    })

    return () => timerRefs.current.forEach(clearTimeout)
  }, [])

  if (done) return null

  return (
    <>
      <style>{css}</style>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#000',
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADEOUT_MS}ms ease`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Ghost silhouettes */}
        <div style={{
          position: 'absolute', left: '28%', top: '12%',
          width: 160, height: 340,
          background: 'linear-gradient(180deg, #141414 0%, #111 60%, transparent 100%)',
          borderRadius: '50% 50% 42% 42% / 12% 12% 30% 30%',
          filter: 'blur(28px)',
          opacity: 0.55,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: '26%', top: '18%',
          width: 140, height: 300,
          background: 'linear-gradient(180deg, #131313 0%, #111 60%, transparent 100%)',
          borderRadius: '50% 50% 42% 42% / 12% 12% 30% 30%',
          filter: 'blur(32px)',
          opacity: 0.45,
          pointerEvents: 'none',
        }} />

        {/* Terminal block */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: 'clamp(13px, 1.4vw, 17px)',
            letterSpacing: '0.08em',
            lineHeight: 2,
            color: '#e0e0e0',
            minWidth: 340,
            maxWidth: '90vw',
          }}
        >
          {LINES.slice(0, visibleCount).map((line, i) => (
            <div key={i} className="ls-line">
              {line}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

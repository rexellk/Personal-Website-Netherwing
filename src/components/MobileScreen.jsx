import '../web_components/portfolio.css'
import { HERO } from '../data/portfolioData'

export default function MobileScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#03000a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow behind content */}
      <div
        style={{
          position: 'absolute',
          width: '340px',
          height: '500px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(157,78,221,0.22), transparent 70%)',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Vertical rift slit */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '8%',
          bottom: '8%',
          width: '1px',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(199,125,255,0.25) 25%, rgba(199,125,255,0.55) 50%, rgba(199,125,255,0.25) 75%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 28px', width: '100%', maxWidth: '420px' }}>

        {/* Name */}
        <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(157,78,221,0.16), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <span className="pv-name-first">{HERO.firstName}</span>
          <span className="pv-name-last">{HERO.lastName}</span>
        </div>

        {/* Role line */}
        <div className="pv-role-line" style={{ marginTop: 20 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(199,125,255,0.72)' }}>
            {HERO.tagline}
          </span>
        </div>

        {/* Sub text */}
        <p className="pv-sub-text">{HERO.sub}</p>

        {/* CTA buttons — touch-friendly sizing */}
        <div className="pv-cta-row" style={{ justifyContent: 'center', marginTop: 36 }}>
          <a
            href={HERO.resumeUrl}
            className="pv-btn-primary"
            target="_blank"
            rel="noreferrer"
            style={{ padding: '15px 36px', fontSize: 12 }}
          >
            View Resume
          </a>
          <a
            href={`mailto:${HERO.email}`}
            className="pv-btn-ghost"
            style={{ padding: '15px 36px', fontSize: 12 }}
          >
            Email
          </a>
        </div>

        {/* Desktop notice */}
        <div
          style={{
            marginTop: 52,
            padding: '18px 20px',
            border: '1px solid rgba(199,125,255,0.14)',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(8px)',
            opacity: 0,
            animation: 'pv-fadeIn 1s ease 1.8s forwards',
          }}
        >
          <p
            style={{
              fontSize: 9,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(199,125,255,0.5)',
              margin: 0,
            }}
          >
            Desktop Experience Required
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(224,170,255,0.42)',
              margin: '10px 0 0',
              letterSpacing: '0.04em',
              lineHeight: 1.6,
            }}
          >
            The full experience is only available on desktop.
          </p>
        </div>

      </div>
    </div>
  )
}


import { useEffect, useRef } from 'react'

export default function RiftCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    let W, H, cx, cy

    function resize() {
      W = c.width  = window.innerWidth
      H = c.height = window.innerHeight
      cx = W / 2; cy = H / 2
    }
    resize()
    window.addEventListener('resize', resize)

    const lerp  = (a, b, t) => a + (b - a) * t
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
    const ph    = (t, s, e) => clamp((t - s) / (e - s), 0, 1)
    const eOut  = t => 1 - Math.pow(1 - t, 3)
    const eIn   = t => t * t * t
    const eIO   = t => t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2
    const dr    = i => ((i * 1664525  + 1013904223) >>> 0) / 0xFFFFFFFF
    const dr2   = i => ((i * 22695477 + 12345)      >>> 0) / 0xFFFFFFFF
    const safe  = v => (isNaN(v) || !isFinite(v)) ? 0 : clamp(v, 0, 1)

    const N_TEAR = 52
    const TEAR_Y0 = 0.04
    const TEAR_Y1 = 0.96
    const tearNoise = Array.from({length: N_TEAR + 1}, (_, i) =>
      Math.sin(i * 2.71828 + 0.3) * 30 +
      Math.sin(i * 5.31415 + 0.9) * 18 +
      Math.sin(i * 0.9100  + 2.2) * 12
    )

    function getTearPts(halfOpen) {
      return Array.from({length: N_TEAR + 1}, (_, i) => {
        const y     = lerp(H * TEAR_Y0, H * TEAR_Y1, i / N_TEAR)
        const noise = tearNoise[i]
        return { y, lx: cx + noise - halfOpen, rx: cx + noise + halfOpen }
      })
    }

    const STARS = Array.from({length: 220}, (_, i) => ({
      x:   dr(i*3),
      y:   dr(i*3+1),
      r:   dr2(i*3+2) * 1.8 + 0.3,
      bri: dr(i*3+3)  * 0.55 + 0.18,
      ph:  dr2(i)     * Math.PI * 2,
    }))

    const PARTS = Array.from({length: 160}, (_, i) => ({
      ox:   dr(i*5)   * 2 - 1,
      oy:   dr(i*5+1) * 2 - 1,
      spd:  dr(i*5+2) * 0.004 + 0.001,
      r:    dr2(i*3)  * 2.5 + 0.4,
      cyan: i % 7 === 0,
      ph:   dr2(i)    * Math.PI * 2,
      drift:dr(i+200) - 0.5,
    }))

    const BOLTS = [
      {x:.70, y:.22, a:2.30, cyan:true },
      {x:.28, y:.36, a:-.60, cyan:false},
      {x:.76, y:.52, a:1.82, cyan:true },
      {x:.20, y:.60, a:-1.0, cyan:true },
      {x:.62, y:.68, a:2.05, cyan:false},
      {x:.36, y:.18, a:-.32, cyan:true },
      {x:.82, y:.42, a:1.42, cyan:true },
      {x:.16, y:.46, a:-1.5, cyan:false},
    ]

    function drawBg(atmosP, t) {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0,0,W,H)
      for (const s of STARS) {
        const twinkle = 0.5 + 0.5 * Math.sin(s.ph + t * 1.5)
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.bri * twinkle})`
        ctx.fill()
      }
      if (atmosP > 0) {
        const g = ctx.createRadialGradient(cx, cy*.52, 0, cx, cy*.52, W*.78)
        g.addColorStop(0,    `rgba(95,8,165,${safe(atmosP*.35)})`)   // was .88
        g.addColorStop(0.35, `rgba(55,3,100,${safe(atmosP*.25)})`)   // was .72
        g.addColorStop(0.68, `rgba(22,0, 52,${safe(atmosP*.15)})`)   // was .52
        g.addColorStop(1,    'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0,0,W,H)
      }
    }

    function drawVoid(pts, halfOpen, glow, t) {
        if (halfOpen <= 0) return
        ctx.save()

        // punch transparent hole through the black fabric
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.moveTo(pts[0].lx, pts[0].y)
        for (const p of pts) ctx.lineTo(p.lx, p.y)
        for (let i = pts.length-1; i >= 0; i--) ctx.lineTo(pts[i].rx, pts[i].y)
        ctx.closePath()
        ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.fill()

        ctx.restore()

        // then draw the purple glow on top of the hole edges
        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        ctx.beginPath()
        ctx.moveTo(pts[0].lx, pts[0].y)
        for (const p of pts) ctx.lineTo(p.lx, p.y)
        for (let i = pts.length-1; i >= 0; i--) ctx.lineTo(pts[i].rx, pts[i].y)
        ctx.closePath()
        const vg = ctx.createLinearGradient(cx - halfOpen, cy, cx + halfOpen, cy)
        vg.addColorStop(0,    `rgba(10,1,28,${safe(glow * 0.6)})`)
        vg.addColorStop(0.28, `rgba(55,5,110,${safe(glow * 0.4)})`)
        vg.addColorStop(0.50, `rgba(85,8,160,${safe(glow * 0.2)})`)
        vg.addColorStop(0.72, `rgba(55,5,110,${safe(glow * 0.4)})`)
        vg.addColorStop(1,    `rgba(10,1,28,${safe(glow * 0.6)})`)
        ctx.fillStyle = vg
        ctx.fill()
        ctx.restore()
        }

    function drawRiftEdges(pts, halfOpen, glow) {
      if (halfOpen <= 1) return
      ctx.save()
      ctx.shadowColor = '#9922dd'
      ctx.shadowBlur  = 28 * glow
      ctx.strokeStyle = `rgba(172, 72, 255, ${safe(glow * .88)})`
      ctx.lineWidth   = 2.5 + glow * 3.5
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0].lx, pts[0].y)
      for (const p of pts) ctx.lineTo(p.lx, p.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pts[0].rx, pts[0].y)
      for (const p of pts) ctx.lineTo(p.rx, p.y)
      ctx.stroke()
      ctx.restore()
    }

    function drawParticles(p, t) {
      if (p <= 0) return
      for (const pt of PARTS) {
        const age = ((t * pt.spd * 80 + pt.ph) % 1)
        const a   = (1 - age) * p * 0.72
        const px  = cx + pt.ox * W * 0.46 + Math.sin(t * 0.5 + pt.ph) * 28 * pt.drift
        const py  = H * 0.52 + pt.oy * H * 0.44
        ctx.beginPath()
        ctx.arc(px, py, pt.r, 0, Math.PI * 2)
        ctx.fillStyle = pt.cyan ? `rgba(78,218,255,${safe(a)})` : `rgba(198,98,255,${safe(a)})`
        ctx.fill()
      }
    }

    function drawLightning(p, t) {
      if (p <= 0) return
      ctx.save()
      for (let bi = 0; bi < BOLTS.length; bi++) {
        const b = BOLTS[bi]
        if (Math.sin(t * 9.3 + bi * 2.7) < 0.12) continue
        const bx = b.x * W, by = b.y * H
        const sl = 20 + bi * 5, seg = 5 + (bi % 3)
        ctx.shadowColor = b.cyan ? '#22eeff' : '#dd55ff'
        ctx.shadowBlur  = 14
        ctx.strokeStyle = b.cyan
          ? `rgba(78,224,255,${safe(p*.85)})`
          : `rgba(218,98,255,${safe(p*.75)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        let lx = bx, ly = by
        for (let s = 0; s < seg; s++) {
          const j = s%2===0 ? .45 : -.45
          const nx = lx + Math.cos(b.a+j)*sl
          const ny = ly + Math.sin(b.a+j)*sl
          s===0 ? ctx.moveTo(lx,ly) : ctx.lineTo(nx,ny)
          lx=nx; ly=ny
        }
        ctx.stroke()
        ctx.save()
        ctx.fillStyle = b.cyan ? 'rgba(78,224,255,.82)' : 'rgba(218,98,255,.72)'
        ctx.beginPath()
        ctx.translate(bx,by); ctx.rotate(b.a)
        ctx.moveTo(0,-7); ctx.lineTo(5,0); ctx.lineTo(0,7); ctx.lineTo(-5,0)
        ctx.closePath(); ctx.fill()
        ctx.restore()
      }
      ctx.restore()
    }

    const CYCLE = 17
    let t0 = null
    let frameId

    function render(ts) {
      if (!t0) t0 = ts
      if (!W || !H) { frameId = requestAnimationFrame(render); return }
      const t = ((ts - t0) / 1000) % CYCLE

      ctx.clearRect(0,0,W,H)

      const maxHalfOpen = Math.max(1, Math.min(W * .40, 400))
      const crackP  = eIO(ph(t, 1.2, 2.4))
      const riftP   = eIO(ph(t, 2.2, 5.8))
      const lightP  =     ph(t, 6.0, 8.0)
      const partP   = eOut(ph(t, 4.0, 8.5))
      const fadeP   = eIn( ph(t, 15.0, 17.0))

      const halfOpen    = (crackP * 0.04 + eOut(riftP) * 0.96) * maxHalfOpen
      const glow        = safe(halfOpen / (maxHalfOpen * .4))
      const openProgress = safe(halfOpen / maxHalfOpen)
      const pts = getTearPts(halfOpen)

      drawBg(glow, t)
      drawParticles(partP * glow, t)
      drawVoid(pts, halfOpen, glow, t)
      drawRiftEdges(pts, halfOpen, glow)
      drawLightning(lightP, t)

      if (fadeP > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fadeP})`
        ctx.fillRect(0,0,W,H)
      }

      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

    return (
    <canvas
        ref={canvasRef}
        style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10,           // ← in front, acting as fabric
        pointerEvents: 'none'
        }}
    />
    )
}
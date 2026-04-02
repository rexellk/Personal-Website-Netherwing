import { useEffect, useRef } from "react";

export default function RiftCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    let W, H, cx, cy;

    function resize() {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
      cx = W / 2;
      cy = H / 2;
    }
    resize();
    window.addEventListener("resize", resize);

    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const ph = (t, s, e) => clamp((t - s) / (e - s), 0, 1);
    const eOut = (t) => 1 - Math.pow(1 - t, 3);
    const eIn = (t) => t * t * t;
    const eIO = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const dr = (i) => ((i * 1664525 + 1013904223) >>> 0) / 0xffffffff;
    const dr2 = (i) => ((i * 22695477 + 12345) >>> 0) / 0xffffffff;
    const safe = (v) => (isNaN(v) || !isFinite(v) ? 0 : clamp(v, 0, 1));

    const N_TEAR = 52;
    const TEAR_Y0 = 0.04;
    const TEAR_Y1 = 0.96;

    function getTearPts(halfOpen, t) {
      const maxSpan = Math.hypot(W, H) * 1.2;

      return Array.from({ length: N_TEAR + 1 }, (_, i) => {
        const y = lerp(cy - maxSpan / 2, cy + maxSpan / 2, i / N_TEAR);

        // Injecting 't' makes the sine waves crawl — edges ripple like fabric in the wind
        const noise =
          Math.sin(i * 0.6 + t * 3.5) * 20 +
          Math.sin(i * 1.5 - t * 2.0) * 12 +
          Math.sin(i * 2.8 + t * 5.0) * 8;

        return {
          y,
          lx: cx + noise - halfOpen * 0.8,
          rx: cx + noise + halfOpen * 0.7,
        };
      });
    }

    // Expose global rift timing reference for sync
    window.riftTimingRef = {
      crackStart: 1.2,
      crackEnd: 2.4,
      riftStart: 2.2,
      riftEnd: 5.8,
    };

    const STARS = Array.from({ length: 350 }, (_, i) => ({
      x: dr(i * 3),
      y: dr(i * 3 + 1),
      r: dr2(i * 3 + 2) * 1.6 + 0.2,
      bri: dr(i * 3 + 3) * 0.8 + 0.2,
      ph: dr2(i) * Math.PI * 2,
      vx: (dr2(i + 100) - 0.5) * 0.03,
      vy: (dr(i + 200) - 0.5) * 0.03 + 0.01,
    }));

    const PARTS = Array.from({ length: 160 }, (_, i) => ({
      ox: dr(i * 5) * 2 - 1,
      oy: dr(i * 5 + 1) * 2 - 1,
      spd: dr(i * 5 + 2) * 0.004 + 0.001,
      r: dr2(i * 3) * 2.5 + 0.4,
      cyan: i % 7 === 0,
      ph: dr2(i) * Math.PI * 2,
      drift: dr(i + 200) - 0.5,
    }));

    const BOLTS = [
      { x: 0.7, y: 0.22, a: 2.3, cyan: true },
      { x: 0.28, y: 0.36, a: -0.6, cyan: false },
      { x: 0.76, y: 0.52, a: 1.82, cyan: true },
      { x: 0.2, y: 0.6, a: -1.0, cyan: true },
      { x: 0.62, y: 0.68, a: 2.05, cyan: false },
      { x: 0.36, y: 0.18, a: -0.32, cyan: true },
      { x: 0.82, y: 0.42, a: 1.42, cyan: true },
      { x: 0.16, y: 0.46, a: -1.5, cyan: false },
    ];

    function drawBg(atmosP, t) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      for (const s of STARS) {
        s.x = (s.x + s.vx * 0.016) % 1;
        s.y = (s.y - s.vy * 0.016) % 1;
        if (s.x < 0) s.x += 1;
        if (s.y < 0) s.y += 1;

        const twinkle = 0.5 + 0.5 * Math.sin(s.ph + t * 0.3);

        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);

        if (s.r > 1.2) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#cc33ff";
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `rgba(255,255,255,${s.bri * twinkle})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (atmosP > 0) {
        const g = ctx.createRadialGradient(
          cx,
          cy * 0.52,
          0,
          cx,
          cy * 0.52,
          W * 0.78,
        );
        g.addColorStop(0, `rgba(95,8,165,${safe(atmosP * 0.35)})`); // was .88
        g.addColorStop(0.35, `rgba(55,3,100,${safe(atmosP * 0.25)})`); // was .72
        g.addColorStop(0.68, `rgba(22,0, 52,${safe(atmosP * 0.15)})`); // was .52
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function drawVoid(pts, halfOpen, glow, t) {
      if (halfOpen <= 0) return;
      ctx.save();

      // punch transparent hole through the black fabric
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(pts[0].lx, pts[0].y);
      for (const p of pts) ctx.lineTo(p.lx, p.y);
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].rx, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fill();

      ctx.restore();

      // then draw the purple glow on top of the hole edges
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(pts[0].lx, pts[0].y);
      for (const p of pts) ctx.lineTo(p.lx, p.y);
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].rx, pts[i].y);
      ctx.closePath();
      const vg = ctx.createLinearGradient(cx - halfOpen, cy, cx + halfOpen, cy);
      vg.addColorStop(0, `rgba(10,1,28,${safe(glow * 0.6)})`);
      vg.addColorStop(0.28, `rgba(55,5,110,${safe(glow * 0.4)})`);
      vg.addColorStop(0.5, `rgba(85,8,160,${safe(glow * 0.2)})`);
      vg.addColorStop(0.72, `rgba(55,5,110,${safe(glow * 0.4)})`);
      vg.addColorStop(1, `rgba(10,1,28,${safe(glow * 0.6)})`);
      ctx.fillStyle = vg;
      ctx.fill();
      ctx.restore();
    }

    function drawShards(pts, halfOpen, glow, t) {
      if (halfOpen <= 1) return;

      ctx.save();
      ctx.globalCompositeOperation = "lighter"; // Additive blending for glowing effect

      // Draw shards radiating outward from the edges
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const pNext = pts[(i + 1) % pts.length];

        // Randomly generate shards along edges (every few points, with variation)
        if (Math.sin(i * 3.7 + t * 2) > 0.4) {
          const shardLength = 40 + Math.sin(i * 2.3 + t) * 20;
          const shardWidth = 8 + Math.sin(i * 1.1) * 4;

          // Left edge shard
          const lAngle = Math.atan2(p.y - cy, p.lx - cx) - Math.PI / 2;
          ctx.save();
          ctx.translate(p.lx, p.y);
          ctx.rotate(lAngle);
          ctx.fillStyle = `rgba(120,40,200,${safe(glow * 0.5)})`;
          ctx.fillRect(
            -shardWidth / 2,
            -shardLength / 2,
            shardWidth,
            shardLength,
          );
          ctx.restore();

          // Right edge shard
          const rAngle = Math.atan2(p.y - cy, p.rx - cx) + Math.PI / 2;
          ctx.save();
          ctx.translate(p.rx, p.y);
          ctx.rotate(rAngle);
          ctx.fillStyle = `rgba(100,20,180,${safe(glow * 0.4)})`;
          ctx.fillRect(
            -shardWidth / 2,
            -shardLength / 2,
            shardWidth,
            shardLength,
          );
          ctx.restore();
        }
      }

      ctx.restore();
    }

    function drawRiftEdges(pts, halfOpen, glow) {
      if (halfOpen <= 1) return;
      ctx.save();
      ctx.shadowColor = "#9922dd";
      ctx.shadowBlur = 28 * glow;
      ctx.strokeStyle = `rgba(172, 72, 255, ${safe(glow * 0.88)})`;
      ctx.lineWidth = 2.5 + glow * 3.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].lx, pts[0].y);
      for (const p of pts) ctx.lineTo(p.lx, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pts[0].rx, pts[0].y);
      for (const p of pts) ctx.lineTo(p.rx, p.y);
      ctx.stroke();
      ctx.restore();
    }

    function drawParticles(p, t) {
      if (p <= 0) return;
      for (const pt of PARTS) {
        const age = (t * pt.spd * 80 + pt.ph) % 1;
        const a = (1 - age) * p * 0.72;
        const px =
          cx + pt.ox * W * 0.46 + Math.sin(t * 0.5 + pt.ph) * 28 * pt.drift;
        const py = H * 0.52 + pt.oy * H * 0.44;
        ctx.beginPath();
        ctx.arc(px, py, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = pt.cyan
          ? `rgba(78,218,255,${safe(a)})`
          : `rgba(198,98,255,${safe(a)})`;
        ctx.fill();
      }
    }

    function drawLightning(p, t) {
      if (p <= 0) return;
      ctx.save();
      for (let bi = 0; bi < BOLTS.length; bi++) {
        const b = BOLTS[bi];
        if (Math.sin(t * 9.3 + bi * 2.7) < 0.12) continue;
        const bx = b.x * W,
          by = b.y * H;
        const sl = 20 + bi * 5,
          seg = 5 + (bi % 3);
        ctx.shadowColor = b.cyan ? "#22eeff" : "#dd55ff";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = b.cyan
          ? `rgba(78,224,255,${safe(p * 0.85)})`
          : `rgba(218,98,255,${safe(p * 0.75)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let lx = bx,
          ly = by;
        for (let s = 0; s < seg; s++) {
          const j = s % 2 === 0 ? 0.45 : -0.45;
          const nx = lx + Math.cos(b.a + j) * sl;
          const ny = ly + Math.sin(b.a + j) * sl;
          s === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(nx, ny);
          lx = nx;
          ly = ny;
        }
        ctx.stroke();
        ctx.save();
        ctx.fillStyle = b.cyan
          ? "rgba(78,224,255,.82)"
          : "rgba(218,98,255,.72)";
        ctx.beginPath();
        ctx.translate(bx, by);
        ctx.rotate(b.a);
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    const CYCLE = 17;
    let t0 = null;
    let frameId;

    function render(ts) {
      if (!t0) t0 = ts;
      if (!W || !H) {
        frameId = requestAnimationFrame(render);
        return;
      }

      // 1. AMBIENT TIME (for stars, lightning, particles to keep moving)
      const t = ((ts - t0) / 1000) % CYCLE;

      // 2. STRUCTURAL TIME (Sync strictly to the 3D animation!)
      let dragonTime = 0;
      if (window.primaryDragonAction) {
        dragonTime = window.primaryDragonAction.time;
      }

      ctx.clearRect(0, 0, W, H);

      // Apply global shake offset
      const shakeX = window.shakeOffset?.x || 0;
      const shakeY = window.shakeOffset?.y || 0;
      ctx.save();
      ctx.translate(shakeX * W * 0.01, shakeY * H * 0.01);

      const maxHalfOpen = Math.max(1, Math.min(W * 0.4, 400));

      // --- EXACT SYNC TIMESTAMPS ---
      // Tweak these two numbers to match the exact seconds of your .glb animation
      const CLAW_IMPACT = 1.2; // Second when the claw first pierces the screen
      const CLAW_FINISH = 2.8; // Second when the claw is fully extended

      // We calculate the opening based on dragonTime, NOT the looping 't'
      const crackP = eIO(ph(dragonTime, CLAW_IMPACT, CLAW_IMPACT + 0.4));
      const riftP = eIO(ph(dragonTime, CLAW_IMPACT + 0.2, CLAW_FINISH));

      const lightP = ph(t, 6.0, 8.0); // Keep ambient effects on standard 't'
      const partP = eOut(ph(t, 4.0, 8.5));
      const fadeP = eIn(ph(t, 15.0, 17.0));


      const halfOpen = (crackP * 0.04 + eOut(riftP) * 0.96) * maxHalfOpen;
      const glow = safe(halfOpen / (maxHalfOpen * 0.4));
      const pts = getTearPts(halfOpen, t);

      // Draw the background normally (unrotated)
      drawBg(glow, t);

      // --- CANVAS ROTATION LOGIC (ALIGN WITH THE CLAW) ---
      // Rotate from 40° down to 10° as the rift opens
      const baseAngle = lerp(40, 10, riftP); // 40° → 10° based on opening progress
      const curveAngle = Math.sin(riftP * Math.PI) * 3; // Subtle S-curve (±3° oscillation)
      const angleInDegrees = baseAngle + curveAngle;
      const angleInRadians = angleInDegrees * (Math.PI / 180);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleInRadians);
      ctx.translate(-cx, -cy);

      // Draw everything else on the rotated canvas using 't' for ambient wiggle
      drawParticles(partP * glow, t);
      drawVoid(pts, halfOpen, glow, t);
      drawRiftEdges(pts, halfOpen, glow);
      drawShards(pts, halfOpen, glow, t); // Crystal shards radiating from edges
      drawLightning(lightP, t);

      ctx.restore();
      ctx.restore();

      if (fadeP > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fadeP})`;
        ctx.fillRect(0, 0, W, H);
      }

      frameId = requestAnimationFrame(render);
    }

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9, // ← behind hero text (z:10), in front of dragon (z:1)
        pointerEvents: "none",
      }}
    />
  );
}

import { useEffect, useRef } from "react";

export default function ButterflyCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, animId;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    class Dust {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : H + 8;
        this.r = 0.7 + Math.random() * 1.8;
        this.vy = -0.12 - Math.random() * 0.28;
        this.vx = (Math.random() - 0.5) * 0.18;
        this.alpha = 0.08 + Math.random() * 0.44;
        this.life = 0;
        this.maxLife = 180 + Math.random() * 380;
        this.col =
          Math.random() < 0.4
            ? "rgba(199,125,255,"
            : Math.random() < 0.5
            ? "rgba(224,170,255,"
            : "rgba(72,202,228,";
      }
      update() {
        this.x += this.vx + Math.sin(this.life * 0.022) * 0.14;
        this.y += this.vy;
        this.life++;
        if (this.life > this.maxLife || this.y < -10) this.reset(false);
      }
      draw() {
        const fade =
          Math.min(this.life / 28, 1) *
          Math.min(1, (this.maxLife - this.life) / 55);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.col + this.alpha * fade + ")";
        ctx.fill();
      }
    }

    class Petal {
      constructor(init) { this.reset(init); }
      reset(init) {
        this.x = (0.15 + Math.random() * 0.7) * W;
        this.y = init ? Math.random() * H : -20;
        this.rot = Math.random() * Math.PI * 2;
        this.rotSpd = (Math.random() - 0.5) * 0.018;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = 0.28 + Math.random() * 0.45;
        this.w = 5 + Math.random() * 9;
        this.h = this.w * 0.48;
        this.alpha = 0.09 + Math.random() * 0.28;
        this.col =
          Math.random() < 0.55
            ? "rgba(255,179,198,"
            : "rgba(224,170,255,";
      }
      update() {
        this.x += this.vx + Math.sin(Date.now() * 0.001 + this.y * 0.01) * 0.28;
        this.y += this.vy;
        this.rot += this.rotSpd;
        if (this.y > H + 20) this.reset(false);
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.w, this.h, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.col + "0.92)";
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = [];
    for (let i = 0; i < 90; i++) particles.push(new Dust(true));
    for (let i = 0; i < 14; i++) particles.push(new Petal(true));

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.update();
        p.draw();
      }
      animId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

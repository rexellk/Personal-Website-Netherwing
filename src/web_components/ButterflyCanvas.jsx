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

    class Butterfly {
      constructor(init) {
        this.hue =
          Math.random() < 0.35
            ? "blue"
            : Math.random() < 0.5
            ? "purple"
            : "lavender";
        this.reset(init);
      }
      reset(init) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : Math.random() < 0.5 ? -60 : H + 60;
        this.vx = (Math.random() - 0.5) * 0.55;
        this.vy = (Math.random() - 0.5) * 0.45 - 0.18;
        this.wingPhase = Math.random() * Math.PI * 2;
        this.wingSpeed = 0.038 + Math.random() * 0.038;
        this.size = 9 + Math.random() * 17;
        this.alpha = 0.14 + Math.random() * 0.52;
        this.wanderT = Math.random() * 1000;
        this.wanderSpeed = 0.003 + Math.random() * 0.003;
      }
      update() {
        this.wanderT += this.wanderSpeed;
        this.x += this.vx + Math.sin(this.wanderT * 1.1) * 0.38;
        this.y += this.vy + Math.cos(this.wanderT * 0.9) * 0.28;
        this.wingPhase += this.wingSpeed;
        if (
          this.x < -120 || this.x > W + 120 ||
          this.y < -120 || this.y > H + 120
        ) {
          this.reset(false);
        }
      }
      draw() {
        const wing = Math.sin(this.wingPhase);
        const w = this.size, h = this.size * 0.62;
        let c1, c2;
        if (this.hue === "blue") {
          c1 = "rgba(72,202,228,0.88)"; c2 = "rgba(72,202,228,0.28)";
        } else if (this.hue === "purple") {
          c1 = "rgba(157,78,221,0.88)"; c2 = "rgba(58,12,163,0.38)";
        } else {
          c1 = "rgba(224,170,255,0.88)"; c2 = "rgba(199,125,255,0.28)";
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.alpha;

        // right wings
        ctx.save();
        ctx.scale(wing, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 0.2, -h * 0.8, w * 1.1, -h * 1.2, w * 1.2, -h * 0.3);
        ctx.bezierCurveTo(w * 1.1, h * 0.3, w * 0.3, h * 0.2, 0, 0);
        ctx.fillStyle = c1; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 0.2, h * 0.38, w * 0.9, h * 0.88, w * 0.8, h * 0.48);
        ctx.bezierCurveTo(w * 0.5, h * 0.18, w * 0.1, h * 0.38, 0, 0);
        ctx.fillStyle = c2; ctx.fill();
        ctx.restore();

        // left wings (mirror)
        ctx.save();
        ctx.scale(-wing, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 0.2, -h * 0.8, w * 1.1, -h * 1.2, w * 1.2, -h * 0.3);
        ctx.bezierCurveTo(w * 1.1, h * 0.3, w * 0.3, h * 0.2, 0, 0);
        ctx.fillStyle = c1; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 0.2, h * 0.38, w * 0.9, h * 0.88, w * 0.8, h * 0.48);
        ctx.bezierCurveTo(w * 0.5, h * 0.18, w * 0.1, h * 0.38, 0, 0);
        ctx.fillStyle = c2; ctx.fill();
        ctx.restore();

        ctx.restore();
      }
    }

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
    for (let i = 0; i < 24; i++) particles.push(new Butterfly(true));
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

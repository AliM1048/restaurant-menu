import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const EMOJIS = ["🍕", "🍷", "🥗", "🍮", "🦞", "🍝", "🥂", "🍖", "🧆"];

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 40,
        size: 14 + Math.random() * 12,
        speedY: -(0.2 + Math.random() * 0.5),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: 0.25 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      };
    }

    resize();
    window.addEventListener("resize", resize);

    // Initial particles
    for (let i = 0; i < 18; i++) {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      particles.push(p);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new particle occasionally
      if (Math.random() < 0.015 && particles.length < 25) {
        particles.push(createParticle());
      }

      particles.forEach((p, i) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        // Remove if off-screen
        if (p.y < -50) particles.splice(i, 1);
      });

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      aria-hidden="true"
      style={{ opacity: theme === "dark" ? 0.22 : 0.12 }}
    />
  );
}

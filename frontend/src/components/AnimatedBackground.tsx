'use client';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTheme } from '../providers/ThemeProvider';

/* ── Particle mesh canvas ─────────────────────────────────────────────── */
function ParticleMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const PARTICLE_COUNT = Math.min(80, Math.floor((W * H) / 15000));
    const isDark = theme === 'dark';

    // Particles get random accent tones — mix of pink and blue to match spinner
    const ACCENTS = isDark
      ? ['rgba(236,72,153,', 'rgba(59,130,246,', 'rgba(139,92,246,', 'rgba(0,212,190,']
      : ['rgba(236,72,153,', 'rgba(59,130,246,', 'rgba(0,158,140,', 'rgba(124,58,237,'];

    const dots = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.4,
      accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Connect nearby dots with gradient lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * (isDark ? 0.12 : 0.08);
            // Gradient line from one dot's color to the other's
            const grad = ctx.createLinearGradient(dots[i].x, dots[i].y, dots[j].x, dots[j].y);
            grad.addColorStop(0, `${dots[i].accent}${alpha})`);
            grad.addColorStop(1, `${dots[j].accent}${alpha})`);
            ctx.beginPath();
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.65;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `${d.accent}${isDark ? 0.55 : 0.4})`;
        ctx.fill();
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ── Animated orbs ────────────────────────────────────────────────────── */
export default function AnimatedBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'var(--bg-0)',
        transition: 'background 0.35s ease',
      }}
    >
      {/* Technical grid */}
      <div className="technical-grid" style={{ position: 'absolute', inset: 0 }} />

      {/* Particle mesh */}
      <ParticleMesh />

      {/* PINK orb — top left, matching spinner */}
      <motion.div
        style={{
          position: 'absolute',
          width: 900, height: 900,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 60%)',
          top: '-22%', left: '-10%',
          filter: 'blur(1px)',
        }}
        animate={{ x: [0, 55, 0], y: [0, -45, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* BLUE orb — bottom right, matching spinner */}
      <motion.div
        style={{
          position: 'absolute',
          width: 800, height: 800,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 62%)'
            : 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 62%)',
          bottom: '-18%', right: '-8%',
          filter: 'blur(1px)',
        }}
        animate={{ x: [0, -50, 0], y: [0, 55, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Purple orb — center right */}
      <motion.div
        style={{
          position: 'absolute',
          width: 520, height: 520,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 62%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 62%)',
          top: '28%', right: '12%',
          filter: 'blur(2px)',
        }}
        animate={{ x: [0, 60, 0], y: [0, -55, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Teal accent orb — mid bottom */}
      <motion.div
        style={{
          position: 'absolute',
          width: 420, height: 420,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(0,212,190,0.1) 0%, transparent 62%)'
            : 'radial-gradient(circle, rgba(0,158,140,0.1) 0%, transparent 62%)',
          bottom: '18%', left: '28%',
          filter: 'blur(2px)',
        }}
        animate={{ x: [0, -38, 0], y: [0, 38, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse at center, transparent 30%, rgba(4,4,10,0.8) 100%)'
            : 'radial-gradient(ellipse at center, transparent 30%, rgba(244,245,250,0.65) 100%)',
          transition: 'background 0.35s ease',
        }}
      />
    </div>
  );
}

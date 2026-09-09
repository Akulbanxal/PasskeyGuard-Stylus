'use client';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      overflow: 'hidden', pointerEvents: 'none',
      background: '#060608',
    }}>
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
      }} />

      {/* Teal orb - top left */}
      <motion.div
        style={{
          position: 'absolute',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,190,0.18) 0%, transparent 65%)',
          top: '-20%', left: '-5%',
          filter: 'blur(1px)',
        }}
        animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Purple orb - bottom right */}
      <motion.div
        style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)',
          bottom: '-10%', right: '-5%',
          filter: 'blur(1px)',
        }}
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Blue orb - center right */}
      <motion.div
        style={{
          position: 'absolute',
          width: 450, height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,142,247,0.11) 0%, transparent 65%)',
          top: '35%', right: '20%',
          filter: 'blur(1px)',
        }}
        animate={{ x: [0, 60, 0], y: [0, -50, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,6,8,0.7) 100%)',
      }} />
    </div>
  );
}

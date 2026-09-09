'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

/* ─── Step definitions ───────────────────────────────────────────────────── */
const STEPS = [
  { icon: '👆', short: 'Biometric', label: 'Biometric Auth', sub: 'Face ID / Touch ID',       color: '#00D4BE' },
  { icon: '🔏', short: 'P-256 Sign', label: 'P-256 Sign',   sub: 'Secure Enclave',            color: '#4F8EF7' },
  { icon: '⚡', short: 'Stylus',    label: 'Stylus Verify', sub: 'On-chain WASM',             color: '#8B5CF6' },
  { icon: '💎', short: 'Fee Skim',  label: 'Fee Skim',      sub: 'fee → Treasury',            color: '#EC4899' },
  { icon: '🛡️', short: 'Policy',   label: 'Policy Check',  sub: 'PolicyManager.sol',         color: '#10B981' },
  { icon: '🚀', short: 'Execute',   label: 'Execute',       sub: 'Arbitrum L2',               color: '#F59E0B' },
];

/* ─── Geometry ───────────────────────────────────────────────────────────── */
const W = 560, H = 560;
const CX = W / 2, CY = H / 2;
const RING_R = 168;
const NODE_R  = 32;
const LABEL_R = 228;   // radius at which label text anchors

function polar(i: number, r: number) {
  // Node 0 starts at top (-90°), stepping 60° clockwise
  const θ = ((-90 + i * 60) * Math.PI) / 180;
  return { x: CX + r * Math.cos(θ), y: CY + r * Math.sin(θ) };
}

// Full-circle motion path starting at top, clockwise (two semi-arcs)
const MOTION_PATH = [
  `M ${CX},${CY - RING_R}`,
  `A ${RING_R},${RING_R} 0 0 1 ${CX},${CY + RING_R}`,
  `A ${RING_R},${RING_R} 0 0 1 ${CX},${CY - RING_R}`,
].join(' ');

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function textAnchor(i: number) {
  const angle = -90 + i * 60; // -90, -30, 30, 90, 150, 210
  if (angle > -60 && angle < 60) return 'start';   // right side
  if (Math.abs(angle) > 120) return 'end';          // left side
  return 'middle';                                   // top / bottom
}

function labelOffset(i: number): { dx: number; dy: number } {
  const anchor = textAnchor(i);
  return {
    dx: anchor === 'start' ? 12 : anchor === 'end' ? -12 : 0,
    dy: i === 0 ? -12 : i === 3 ? 16 : 4,           // nudge top/bottom nodes
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function OrbitalFlow({ protocolFeeEth = '0.0001' }: { protocolFeeEth?: string }) {
  const [active, setActive] = useState<number | null>(null);

  const steps = STEPS.map((s, i) =>
    i === 3 ? { ...s, sub: `${protocolFeeEth} ETH → Treasury` } : s
  );

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 24, backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '1.5rem 1.25rem 1rem',
      width: '100%', maxWidth: 560,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    }}>
      {/* Ambient corner glow */}
      <motion.div
        animate={{ opacity: [0.35, 0.72, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: -48, left: -48,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,190,0.16) 0%, transparent 70%)',
          filter: 'blur(24px)', pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.75rem', position: 'relative',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)',
        }}>
          Transaction Flow
        </span>
        <motion.span
          animate={{ opacity: [1, 0.45, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--teal)',
            background: 'var(--teal-dim)', border: '1px solid rgba(0,212,190,0.22)',
            borderRadius: 100, padding: '0.2rem 0.65rem',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          LIVE
        </motion.span>
      </div>

      {/* ── SVG Orbital Diagram ── */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        aria-label="Orbital transaction flow diagram"
      >
        <defs>
          {/* Ring gradient */}
          <linearGradient id="ofRingGrad" gradientUnits="userSpaceOnUse"
            x1={CX} y1={CY - RING_R} x2={CX + RING_R * 0.8} y2={CY + RING_R * 0.8}>
            <stop offset="0%"   stopColor="#00D4BE" stopOpacity="0.55" />
            <stop offset="40%"  stopColor="#8B5CF6" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.55" />
          </linearGradient>

          {/* Particle glow filter */}
          <filter id="ofGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="ofGlowSm" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Hidden motion path */}
          <path id="ofMotionPath" d={MOTION_PATH} fill="none" stroke="none" />
        </defs>

        {/* ── Subtle spoke lines from center ── */}
        {steps.map((step, i) => {
          const inner = polar(i, RING_R - NODE_R - 2);
          return (
            <line key={i}
              x1={CX} y1={CY} x2={inner.x} y2={inner.y}
              stroke={step.color} strokeWidth="0.7" strokeOpacity="0.10"
            />
          );
        })}

        {/* ── Ring track (dashed) ── */}
        <circle cx={CX} cy={CY} r={RING_R}
          fill="none"
          stroke="url(#ofRingGrad)"
          strokeWidth="1.8"
          strokeDasharray="5 7"
          opacity="0.7"
        />

        {/* ── Traveling particle 1 (teal, leads) ── */}
        <circle r="7" fill="#00D4BE" filter="url(#ofGlow)">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto">
            <mpath href="#ofMotionPath" />
          </animateMotion>
        </circle>

        {/* ── Traveling particle 2 (pink, trails by half cycle) ── */}
        <circle r="4.5" fill="#EC4899" filter="url(#ofGlowSm)" opacity="0.75">
          <animateMotion dur="5s" repeatCount="indefinite" begin="-2.5s" rotate="auto">
            <mpath href="#ofMotionPath" />
          </animateMotion>
        </circle>

        {/* ── Traveling particle 3 (purple, quarter offset) ── */}
        <circle r="3" fill="#8B5CF6" filter="url(#ofGlowSm)" opacity="0.55">
          <animateMotion dur="5s" repeatCount="indefinite" begin="-1.25s" rotate="auto">
            <mpath href="#ofMotionPath" />
          </animateMotion>
        </circle>

        {/* ── Node circles + labels ── */}
        {steps.map((step, i) => {
          const p     = polar(i, RING_R);
          const lp    = polar(i, LABEL_R);
          const off   = labelOffset(i);
          const anch  = textAnchor(i);
          const isAct = active === i;

          return (
            <g key={i}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              style={{ cursor: 'default' }}
              role="img"
              aria-label={`${step.label}: ${step.sub}`}
            >
              {/* Outer hover ring */}
              {isAct && (
                <circle cx={p.x} cy={p.y} r={NODE_R + 11}
                  fill="none"
                  stroke={step.color}
                  strokeWidth="1.2" strokeOpacity="0.45"
                />
              )}

              {/* Node background */}
              <circle cx={p.x} cy={p.y} r={NODE_R}
                fill={`${step.color}18`}
                stroke={step.color}
                strokeWidth={isAct ? 2 : 1.3}
                strokeOpacity={isAct ? 0.95 : 0.5}
              >
                {/* Subtle breathing pulse on each node */}
                <animate attributeName="stroke-opacity"
                  values="0.35;0.65;0.35"
                  dur="3s"
                  begin={`${i * 0.42}s`}
                  repeatCount="indefinite" />
              </circle>

              {/* Icon (emoji) */}
              <text x={p.x} y={p.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="17" style={{ userSelect: 'none' }}>
                {step.icon}
              </text>

              {/* Pulsing status dot (top-right of node) */}
              <circle
                cx={p.x + NODE_R - 8} cy={p.y - NODE_R + 8}
                r="5" fill={step.color}
              >
                <animate attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="2.4s"
                  begin={`${i * 0.3}s`}
                  repeatCount="indefinite" />
                <animate attributeName="r"
                  values="3.8;5.5;3.8"
                  dur="2.4s"
                  begin={`${i * 0.3}s`}
                  repeatCount="indefinite" />
              </circle>

              {/* Label: short name always visible */}
              <text
                x={lp.x + off.dx}
                y={lp.y + off.dy}
                textAnchor={anch}
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-display)"
                fill={isAct ? step.color : 'var(--text-2)'}
              >
                {step.short}
              </text>

              {/* Subtitle: only on hover */}
              {isAct && (
                <text
                  x={lp.x + off.dx}
                  y={lp.y + off.dy + 15}
                  textAnchor={anch}
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  fill="var(--text-3)"
                  opacity="0.9"
                >
                  {step.sub}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Center hub ── */}
        <circle cx={CX} cy={CY} r="36"
          fill="var(--bg-2)"
          stroke="rgba(0,212,190,0.35)"
          strokeWidth="1.2" />
        <text x={CX} y={CY - 8}
          textAnchor="middle"
          fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="800"
          fill="#00D4BE" letterSpacing="1">
          P·G
        </text>
        <text x={CX} y={CY + 9}
          textAnchor="middle"
          fontSize="8" fontFamily="var(--font-mono)"
          fill="var(--text-3)" letterSpacing="0.5">
          WEB3
        </text>
        {/* Center breathing dot */}
        <circle cx={CX} cy={CY} r="4" fill="rgba(0,212,190,0.65)">
          <animate attributeName="r"  values="3;5.5;3" dur="2.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
}

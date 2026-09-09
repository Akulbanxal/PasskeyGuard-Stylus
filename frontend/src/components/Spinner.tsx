'use client';
import { motion } from 'framer-motion';

interface SpinnerProps {
  className?: string;
  outerSize?: string;
  childSize?: string;
  label?: string;
}

export default function Spinner({ label }: SpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(to bottom left, #ec4899, #3b82f6)',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'var(--bg-1)',
        }} />
      </motion.div>
      {label && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-2)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

/* Inline variant for use inside buttons */
export function SpinnerInline() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'linear-gradient(to bottom left, #ec4899, #3b82f6)',
        padding: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: '#060608',
      }} />
    </motion.div>
  );
}

'use client';
import { motion } from 'framer-motion';

const protocols = [
  "Safe", "Arbitrum", "Optimism", "Polygon", "Base", "Stylus", "WebAuthn"
];

export default function InfiniteMarquee() {
  return (
    <div style={{
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      position: 'relative',
      padding: '2.5rem 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-1)',
      display: 'flex',
      alignItems: 'center',
      marginTop: '4rem'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '15%', height: '100%',
        background: 'linear-gradient(to right, var(--bg-1), transparent)',
        zIndex: 2
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '15%', height: '100%',
        background: 'linear-gradient(to left, var(--bg-1), transparent)',
        zIndex: 2
      }} />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        style={{ display: 'flex', gap: '4.5rem', paddingRight: '4.5rem' }}
      >
        {/* Duplicate list for seamless loop */}
        {[...protocols, ...protocols, ...protocols, ...protocols].map((protocol, i) => (
          <div key={i} style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.65rem',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            letterSpacing: '-0.02em'
          }}>
            <span style={{ color: 'var(--teal)', fontSize: '1rem' }}>◆</span>
            {protocol}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

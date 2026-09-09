'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlippingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  // Longest word acts as the invisible "ghost" that sizes the container —
  // the animated word is overlaid absolutely so the layout NEVER shifts.
  const longestWord = words.reduce((a, b) => (a.length >= b.length ? a : b), '');

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 1400);
    return () => clearInterval(timer);
  }, [words]);

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'baseline',
        lineHeight: 'inherit',
      }}
    >
      {/* Ghost / phantom — completely transparent, sizes container to longest word, never selectable */}
      <span
        aria-hidden="true"
        style={{
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          whiteSpace: 'nowrap',
          display: 'inline-block',
          lineHeight: 'inherit',
        }}
      >
        {longestWord}
      </span>

      {/* Animated word — absolute overlay with explicit vibrant gradient and text fill */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[index]}
            initial={{ opacity: 0, y: '80%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-80%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              lineHeight: 'inherit',
              background: 'linear-gradient(135deg, #00D4BE 0%, #38BDF8 60%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: '#00D4BE',
              filter: 'drop-shadow(0 0 24px rgba(0, 212, 190, 0.45))',
            }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

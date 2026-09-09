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
        color: 'var(--teal)',
        verticalAlign: 'bottom',
        lineHeight: 'inherit',
      }}
    >
      {/* Ghost / phantom — invisible, purely sizes the container to the longest word */}
      <span aria-hidden style={{ visibility: 'hidden', whiteSpace: 'nowrap' }}>
        {longestWord}
      </span>

      {/* Animated word — absolute so it never affects layout */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[index]}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'inline-block', whiteSpace: 'nowrap', lineHeight: 'inherit' }}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

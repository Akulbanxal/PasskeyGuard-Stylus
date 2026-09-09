'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlippingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

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
        height: '1.08em',
        lineHeight: 1.08,
        overflow: 'hidden',
        verticalAlign: 'bottom',
        color: 'var(--teal)',
        /* Fixed width — prevents ANY reflow in the parent h1 when words cycle */
        width: '5.5ch',
        minWidth: '5.5ch',
        maxWidth: '5.5ch',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}


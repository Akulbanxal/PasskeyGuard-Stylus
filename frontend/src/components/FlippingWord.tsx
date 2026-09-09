'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlippingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [words]);

  return (
    <span style={{ display: 'inline-block', position: 'relative', width: 'auto', minWidth: '3.5ch', color: 'var(--teal)' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

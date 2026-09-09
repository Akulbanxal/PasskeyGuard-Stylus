'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlippingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [words]);

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'top',
        minWidth: '8.8ch',
        height: '1.2em',
        lineHeight: 1.2,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            lineHeight: 'inherit',
            background: 'linear-gradient(135deg, #00D4BE 0%, #38BDF8 55%, #818CF8 100%)',
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
  );
}

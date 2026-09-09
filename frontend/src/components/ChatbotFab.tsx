'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function ChatbotFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', bottom: '4.5rem', right: 0,
              width: 340, height: 420,
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'var(--bg-2)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, color: '#060608', fontSize: '0.7rem'
                }}>AI</div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-1)' }}>PasskeyGuard AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{
                background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer',
                fontSize: '1.2rem', padding: '0.2rem'
              }}>✕</button>
            </div>
            
            {/* Messages Area */}
            <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'var(--bg-1)', border: '1px solid var(--border)',
                padding: '0.8rem 1rem', borderRadius: '12px 12px 12px 2px',
                color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.5,
                alignSelf: 'flex-start', maxWidth: '85%'
              }}>
                Hello! I'm the PasskeyGuard AI assistant. How can I help you secure your Web3 identity today?
              </div>
            </div>
            
            {/* Input Area */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-0)' }}>
              <input type="text" placeholder="Ask anything..." style={{
                width: '100%', padding: '0.85rem 1rem', borderRadius: 8,
                background: 'var(--bg-1)', border: '1px solid var(--border)',
                color: 'var(--text-1)', fontSize: '0.85rem', outline: 'none',
                boxSizing: 'border-box'
              }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
          border: 'none',
          boxShadow: '0 8px 32px rgba(0,212,190,0.4)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem',
          color: '#060608',
          position: 'relative',
          zIndex: 10
        }}
      >
        {isOpen ? '✕' : '💬'}
      </motion.button>
    </div>
  );
}

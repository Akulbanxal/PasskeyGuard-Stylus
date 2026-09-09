'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message { role: 'ai' | 'user'; text: string; }

const KB: Record<string, string> = {
  what: `PasskeyGuard is a passkey-secured Web3 wallet on Arbitrum Stylus. It uses your device's biometrics (Face ID / Touch ID) to sign blockchain transactions via P-256 ECDSA — all verified on-chain with no custody.`,
  secure: `Extremely secure. Your passkey lives in your device's secure enclave — it never leaves. Every transaction is verified by our Arbitrum Stylus smart contract using P-256 ECDSA, the same algo used by Apple Pay and FIDO2.`,
  start: `Click "Create Account" on the landing page. Your browser will prompt for biometric auth (Face ID / Touch ID). Once registered, no seed phrase is needed — your biometric is your key! 🔐`,
  stylus: `Arbitrum Stylus lets developers write smart contracts in Rust compiled to WASM, running alongside EVM on Arbitrum. Our P-256 verifier in Rust is ~10x more gas-efficient than an equivalent Solidity implementation.`,
  policy: `The PolicyManager contract enforces spending rules. Each transaction's amount is checked against your configured limit before execution. Exceed the limit → transaction reverts. It's all on-chain, immutable policy enforcement.`,
  default: `I can help with PasskeyGuard questions! Try asking: "What is this?", "How secure is it?", "How to start?", "What is Stylus?", or "How do policies work?"`,
};

function getReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('what') || t.includes('passkeyguard') || t.includes('guard')) return KB.what;
  if (t.includes('secur') || t.includes('safe') || t.includes('enclave')) return KB.secure;
  if (t.includes('start') || t.includes('begin') || t.includes('how to') || t.includes('create')) return KB.start;
  if (t.includes('stylus') || t.includes('rust') || t.includes('wasm') || t.includes('arbitrum')) return KB.stylus;
  if (t.includes('policy') || t.includes('limit') || t.includes('spend')) return KB.policy;
  return KB.default;
}

const QUICK = ['What is this?', 'How secure?', 'How to start?', 'What is Stylus?'];

export default function AIAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hey! 👋 I'm your PasskeyGuard AI. Ask me anything about passkey security, Arbitrum Stylus, or how to get started." }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) { setUnread(0); inputRef.current?.focus(); }
  }, [open]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || typing) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    setTyping(false);
    const reply = getReply(text);
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    if (!open) setUnread(n => n + 1);
  }, [typing, open]);

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 200 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88, y: 16, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'absolute', bottom: 68, right: 0,
              width: 340,
              background: 'rgba(10,11,16,0.96)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,190,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(0,212,190,0.08), rgba(79,142,247,0.06))',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}
              >🤖</motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>PasskeyGuard AI</div>
                <div style={{ fontSize: '0.7rem', color: '#00D4BE', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <motion.span
                    style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00D4BE' }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Always online
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '1rem', lineHeight: 1, padding: '4px' }}
              >✕</button>
            </div>

            {/* Messages */}
            <div style={{
              height: 260, overflowY: 'auto',
              padding: '1rem 1rem 0.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.625rem',
              scrollbarWidth: 'none',
            }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{
                    maxWidth: '82%',
                    padding: '0.6rem 0.9rem',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #00D4BE, #4F8EF7)'
                      : 'rgba(255,255,255,0.07)',
                    color: msg.role === 'user' ? '#060608' : '#fff',
                    fontSize: '0.8125rem', lineHeight: 1.55,
                    fontWeight: msg.role === 'user' ? 600 : 400,
                    boxShadow: msg.role === 'user' ? '0 4px 16px rgba(0,212,190,0.2)' : 'none',
                  }}>{msg.text}</div>
                </motion.div>
              ))}

              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{
                    display: 'inline-flex', gap: 4,
                    padding: '0.6rem 0.9rem',
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: '14px 14px 14px 4px',
                  }}>
                    {[0, 1, 2].map(d => (
                      <motion.div key={d}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.18 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <AnimatePresence>
              {messages.length <= 1 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ padding: '0.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}
                >
                  {QUICK.map(q => (
                    <button key={q} onClick={() => send(q)} style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      padding: '0.28rem 0.7rem', borderRadius: 100,
                      border: '1px solid rgba(0,212,190,0.3)',
                      background: 'rgba(0,212,190,0.07)',
                      color: '#00D4BE', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>{q}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Ask anything..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '0.55rem 0.8rem',
                  color: '#fff', fontSize: '0.8125rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,212,190,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => send(input)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#060608', fontSize: '1rem', fontWeight: 700,
                }}
              >↑</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 56, height: 56, borderRadius: '50%',
          background: open
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
          boxShadow: open ? 'none' : '0 8px 32px rgba(0,212,190,0.35)',
          color: open ? '#fff' : '#060608',
          position: 'relative',
        }}
        animate={open ? {} : {
          boxShadow: [
            '0 8px 32px rgba(0,212,190,0.3)',
            '0 8px 48px rgba(0,212,190,0.55)',
            '0 8px 32px rgba(0,212,190,0.3)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >{open ? '✕' : '🤖'}</motion.span>
        </AnimatePresence>

        {/* Unread badge */}
        {unread > 0 && !open && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: '#EF4444', color: '#fff',
              fontSize: '0.65rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #060608',
            }}
          >{unread}</motion.div>
        )}
      </motion.button>
    </div>
  );
}

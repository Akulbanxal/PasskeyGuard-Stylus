'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registerPasskey } from '../../lib/webauthn/register';
import { authenticatePasskey } from '../../lib/webauthn/authenticate';
import { encodePacked, keccak256, parseEther } from 'viem';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';
import AnimatedBackground from '../components/AnimatedBackground';
import FeaturesCarousel from '../components/FeaturesCarousel';
import Footer from '../components/Footer';

const POLICY_LIMIT_ETH = 1000;

const pageTransition = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

/* ─── Shared card style ─────────────────────────────────────────────────── */
const glass: React.CSSProperties = {
  background: 'rgba(12,13,20,0.75)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

export default function App() {
  const [view, setView] = useState<'landing' | 'register' | 'dashboard' | 'composer' | 'result'>('landing');
  const [credId, setCredId] = useState('');
  const [amountEth, setAmountEth] = useState('100');
  const { status, setStatus, txHash, setTxHash } = useTransactionStatus();
  const [policyPassed, setPolicyPassed] = useState<boolean | null>(null);

  const handleRegister = useCallback(async () => {
    setView('register');
    try {
      const result = await registerPasskey('demoUser');
      setCredId(result.credentialId);
      setTimeout(() => setView('dashboard'), 2200);
    } catch (e) {
      console.error(e);
      setView('landing');
    }
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setStatus('authenticating');
    try {
      const nonce = BigInt(0);
      const recipient = '0x0000000000000000000000000000000000000001' as `0x${string}`;
      const amount = parseEther(amountEth || '0');
      const challengeHex = keccak256(encodePacked(['address', 'uint256', 'uint256'], [recipient, amount, nonce]));
      await authenticatePasskey(credId, new Uint8Array(Buffer.from(challengeHex.slice(2), 'hex')));

      setStatus('sending');
      await new Promise(r => setTimeout(r, 900));

      const amt = parseFloat(amountEth) || 0;
      if (amt > POLICY_LIMIT_ETH) {
        setPolicyPassed(false); setStatus('error'); setView('result'); return;
      }
      setPolicyPassed(true);
      setStatus('mining');
      await new Promise(r => setTimeout(r, 900));
      setStatus('success');
      setTxHash('0xsimulatedtxhash...');
      setView('result');
    } catch {
      setStatus('idle');
    }
  }, [credId, amountEth, setStatus, setTxHash]);

  return (
    <>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <AnimatePresence mode="wait">

          {/* ════════════════ LANDING ════════════════ */}
          {view === 'landing' && (
            <motion.div key="landing" {...pageTransition}>
              {/* ── Navbar ── */}
              <motion.nav
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 2rem',
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  background: 'rgba(6,6,8,0.7)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, color: '#060608', fontSize: '0.875rem',
                  }}>P</div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.025em' }}>PasskeyGuard</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  {['Features', 'GitHub', 'Docs'].map(l => (
                    <a key={l} href={l === 'GitHub' ? 'https://github.com/Akulbanxal/PasskeyGuard-Stylus' : `#${l.toLowerCase()}`}
                       target={l === 'GitHub' ? '_blank' : undefined} rel="noreferrer"
                       style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.15s' }}
                       onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                       onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                    >{l}</a>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleRegister}
                  style={{
                    background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    color: '#060608', border: 'none', borderRadius: 9,
                    padding: '0.5rem 1.25rem', fontWeight: 700,
                    fontSize: '0.875rem', cursor: 'pointer',
                  }}
                >Launch App</motion.button>
              </motion.nav>

              {/* ── Hero Section ── */}
              <section style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center',
                paddingTop: '5rem',
              }}>
                <div style={{
                  maxWidth: 1200, margin: '0 auto', padding: '0 2rem',
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '4rem', alignItems: 'center',
                }}>
                  {/* Left: Text */}
                  <div>
                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: '#00D4BE',
                        background: 'rgba(0,212,190,0.08)',
                        border: '1px solid rgba(0,212,190,0.22)',
                        borderRadius: 100, padding: '0.35rem 1rem',
                        marginBottom: '2rem', cursor: 'default',
                      }}>
                        ✦ Powered by Arbitrum Stylus
                      </span>
                    </motion.div>

                    {/* H1 */}
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.65, delay: 0.2 }}
                      style={{
                        fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
                        fontWeight: 800, letterSpacing: '-0.04em',
                        lineHeight: 1.08, marginBottom: '1.5rem',
                      }}
                    >
                      <span style={{
                        background: 'linear-gradient(135deg, #fff 0%, #fff 45%, #00D4BE 75%, #4F8EF7 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        Passkey-Secured<br />Web3 Identity.
                      </span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.35 }}
                      style={{
                        color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem',
                        lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: 440,
                      }}
                    >
                      Your biometric signs. The chain decides. No seed phrases, no custody —
                      just your fingerprint and Arbitrum Stylus P-256 ECDSA on-chain.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.48 }}
                      style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(0,212,190,0.45)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRegister}
                        style={{
                          background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                          color: '#060608', border: 'none', borderRadius: 12,
                          padding: '0.875rem 1.75rem', fontWeight: 800,
                          fontSize: '1rem', cursor: 'pointer',
                          boxShadow: '0 8px 28px rgba(0,212,190,0.28)',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                      >
                        ✦ Create Account
                      </motion.button>
                      <motion.a
                        href="https://github.com/Akulbanxal/PasskeyGuard-Stylus"
                        target="_blank" rel="noreferrer"
                        whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.07)' }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12, padding: '0.875rem 1.75rem',
                          fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                      >
                        View on GitHub →
                      </motion.a>
                    </motion.div>

                    {/* Stats row */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      style={{
                        display: 'flex', gap: '2rem', flexWrap: 'wrap',
                        paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {[
                        { label: 'Signature', value: 'P-256 ECDSA' },
                        { label: 'Runtime', value: 'Stylus WASM' },
                        { label: 'Auth', value: 'WebAuthn L2' },
                      ].map(stat => (
                        <div key={stat.label}>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{stat.label}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#00D4BE', fontFamily: 'monospace' }}>{stat.value}</div>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Right: Animated Flow Diagram */}
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <div style={{
                      ...glass,
                      padding: '2rem', width: '100%', maxWidth: 400,
                      display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>
                        Transaction Flow
                      </div>
                      {[
                        { icon: '👆', step: 'Biometric Auth', detail: 'Face ID / Touch ID', color: '#00D4BE', delay: 0 },
                        { icon: '🔏', step: 'P-256 Sign', detail: 'Secure Enclave', color: '#4F8EF7', delay: 0.4 },
                        { icon: '⚡', step: 'Stylus Verify', detail: 'On-chain WASM', color: '#8B5CF6', delay: 0.8 },
                        { icon: '✅', step: 'Policy Check', detail: 'PolicyManager.sol', color: '#10B981', delay: 1.2 },
                        { icon: '🚀', step: 'Execute', detail: 'Arbitrum L2', color: '#F59E0B', delay: 1.6 },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 + item.delay * 0.4 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '0.75rem 1rem',
                            background: `${item.color}08`,
                            border: `1px solid ${item.color}20`,
                            borderRadius: 12,
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.step}</div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{item.detail}</div>
                          </div>
                          <motion.div
                            style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: item.color,
                            }}
                            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* ── Features Carousel ── */}
              <FeaturesCarousel />

              {/* ── Footer ── */}
              <Footer />
            </motion.div>
          )}

          {/* ════════════════ REGISTER ════════════════ */}
          {view === 'register' && (
            <motion.div key="register" {...pageTransition}
              style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div style={{ ...glass, padding: '3rem', maxWidth: 400, width: '100%', textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #00D4BE, #4F8EF7, #8B5CF6, #00D4BE)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    padding: 3,
                  }}
                >
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: '#0A0B10',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem',
                  }}>
                    {credId ? '✅' : '🔐'}
                  </div>
                </motion.div>

                <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
                  {credId ? 'Registration Complete' : 'Device Registration'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', lineHeight: 1.6 }}>
                  {credId
                    ? 'Your passkey has been registered securely. Redirecting to your dashboard...'
                    : 'Follow your browser prompt to register with Face ID or Touch ID.'}
                </p>

                {!credId && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {[0, 1, 2].map(d => (
                      <motion.div key={d}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D4BE' }}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════════════ DASHBOARD ════════════════ */}
          {view === 'dashboard' && (
            <motion.div key="dashboard" {...pageTransition}
              style={{ minHeight: '100vh', padding: '2rem' }}
            >
              {/* Top nav */}
              <div style={{
                maxWidth: 1200, margin: '0 auto 2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, color: '#060608', fontSize: '0.875rem',
                  }}>P</div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.025em' }}>PasskeyGuard</span>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600, color: '#00D4BE',
                  background: 'rgba(0,212,190,0.08)', border: '1px solid rgba(0,212,190,0.2)',
                  borderRadius: 100, padding: '0.3rem 0.9rem',
                }}>● Passkey Active</span>
              </div>

              <div style={{
                maxWidth: 1200, margin: '0 auto',
                display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '1.5rem',
              }}>
                {/* Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ ...glass, padding: '1.25rem', height: 'fit-content' }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '1rem' }}>Menu</div>
                  {[
                    { label: 'Dashboard', icon: '◉', active: true, action: undefined },
                    { label: 'Send Funds', icon: '↗', active: false, action: () => setView('composer') },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{
                      width: '100%', padding: '0.75rem 1rem',
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      background: item.active ? 'rgba(0,212,190,0.08)' : 'transparent',
                      border: item.active ? '1px solid rgba(0,212,190,0.18)' : '1px solid transparent',
                      borderRadius: 10, color: item.active ? '#00D4BE' : 'rgba(255,255,255,0.55)',
                      fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                      marginBottom: '0.375rem', textAlign: 'left',
                    }}>
                      <span>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </motion.div>

                {/* Main content */}
                <div>
                  {/* Balance card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                      ...glass,
                      background: 'linear-gradient(135deg, rgba(0,212,190,0.06), rgba(79,142,247,0.04), rgba(12,13,20,0.9))',
                      padding: '2rem', marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem' }}>
                      0x000...0001
                    </div>
                    <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
                      $1,<span style={{ color: 'rgba(255,255,255,0.85)' }}>200</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.5em' }}>.00</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(0,212,190,0.35)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('composer')}
                      style={{
                        background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                        color: '#060608', border: 'none', borderRadius: 10,
                        padding: '0.75rem 2rem', fontWeight: 700,
                        fontSize: '0.9rem', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0,212,190,0.2)',
                      }}
                    >↗ Send</motion.button>
                  </motion.div>

                  {/* Activity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ ...glass, padding: '1.5rem' }}
                  >
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>Activity</h3>
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.25)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                      <div style={{ fontSize: '0.875rem' }}>No transactions yet.</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'rgba(255,255,255,0.18)' }}>
                        Send your first transaction to get started.
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Security sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ ...glass, padding: '1.5rem', height: 'fit-content' }}
                >
                  <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '0.9rem' }}>Security Policy</h3>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.875rem', background: 'rgba(0,212,190,0.06)',
                    border: '1px solid rgba(0,212,190,0.15)', borderRadius: 10, marginBottom: '1rem',
                  }}>
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>Tx Limit</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00D4BE', fontSize: '0.9rem' }}>
                      ${POLICY_LIMIT_ETH}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.75rem', color: '#10B981', marginBottom: '1.5rem',
                  }}>
                    <span>●</span> Policy Active
                  </div>
                  <button style={{
                    width: '100%', padding: '0.65rem',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: 'rgba(255,255,255,0.55)',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                  }}>Manage Policy</button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ COMPOSER ════════════════ */}
          {view === 'composer' && (
            <motion.div key="composer" {...pageTransition}
              style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
            >
              <div style={{ ...glass, padding: '2.5rem', maxWidth: 480, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <button
                    onClick={() => setView('dashboard')}
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}
                  >←</button>
                  <h2 style={{ fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.025em' }}>Send Funds</h2>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Recipient</label>
                  <input
                    type="text" disabled
                    defaultValue="0x0000000000000000000000000000000000000001"
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                      padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.5)',
                      fontFamily: 'monospace', fontSize: '0.8rem', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Amount (USD)</label>
                  <input
                    type="number" value={amountEth}
                    onChange={e => setAmountEth(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                      padding: '0.875rem 1rem', color: '#fff',
                      fontSize: '1.2rem', fontWeight: 700, boxSizing: 'border-box', outline: 'none',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,212,190,0.4)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />
                </div>

                {/* Policy strip */}
                <motion.div
                  animate={{
                    borderColor: (parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,190,0.35)',
                    background: (parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? 'rgba(239,68,68,0.06)' : 'rgba(0,212,190,0.05)',
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.875rem 1rem', borderRadius: 10,
                    border: '1px solid', marginBottom: '1.5rem', fontSize: '0.875rem',
                    color: (parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? '#F87171' : '#00D4BE',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>
                    {(parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH ? '⚠️' : '✓'}
                  </span>
                  {(parseFloat(amountEth) || 0) > POLICY_LIMIT_ETH
                    ? 'Exceeds policy limit — will be blocked on-chain.'
                    : 'Within policy limits. Ready to sign.'}
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 36px rgba(0,212,190,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAuthenticate}
                  disabled={status !== 'idle'}
                  style={{
                    width: '100%', padding: '1rem',
                    background: status !== 'idle' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    color: status !== 'idle' ? 'rgba(255,255,255,0.5)' : '#060608',
                    border: 'none', borderRadius: 12, fontWeight: 800,
                    fontSize: '1rem', cursor: status !== 'idle' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(0,212,190,0.15)',
                  }}
                >
                  {status === 'idle' ? '🔐 Authenticate & Send' : '⏳ Processing...'}
                </motion.button>

                {/* Trace */}
                <AnimatePresence>
                  {(status === 'authenticating' || status === 'sending' || status === 'mining' || status === 'preparing') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', overflow: 'hidden' }}
                    >
                      {[
                        { label: 'Biometric Signature', active: status === 'authenticating', done: status !== 'authenticating' },
                        { label: 'Stylus P-256 Verification', active: status === 'sending' || status === 'mining', done: status === 'mining' },
                      ].map((step, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: step.active ? 'rgba(0,212,190,0.06)' : step.done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${step.active ? 'rgba(0,212,190,0.2)' : step.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 10,
                        }}>
                          <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>{step.label}</span>
                          <motion.span
                            style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: step.done ? '#10B981' : step.active ? '#00D4BE' : 'rgba(255,255,255,0.25)' }}
                            animate={step.active ? { opacity: [1, 0.4, 1] } : {}}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          >
                            {step.done ? 'DONE ✓' : step.active ? 'ACTIVE' : 'PENDING'}
                          </motion.span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ════════════════ RESULT ════════════════ */}
          {view === 'result' && (
            <motion.div key="result" {...pageTransition}
              style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
            >
              <div style={{ ...glass, padding: '2.5rem', maxWidth: 480, width: '100%' }}>
                {/* Status icon */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: policyPassed ? 'rgba(0,212,190,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `2px solid ${policyPassed ? 'rgba(0,212,190,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', margin: '0 auto 1.5rem',
                  }}
                >{policyPassed ? '✅' : '🚫'}</motion.div>

                <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                  {policyPassed ? 'Transaction Sent' : 'Transaction Blocked'}
                </h2>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                  {policyPassed ? 'Your transaction was signed and submitted successfully.' : 'Your transaction exceeded the on-chain policy limit.'}
                </p>

                {/* Status cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Authentication', value: '✓ Passkey Verified', ok: true },
                    { label: 'Authorization', value: policyPassed ? '✓ Policy Passed' : '✕ Policy Blocked', ok: policyPassed ?? false },
                  ].map(card => (
                    <div key={card.label} style={{
                      padding: '1rem',
                      background: card.ok ? 'rgba(0,212,190,0.05)' : 'rgba(239,68,68,0.05)',
                      border: `1px solid ${card.ok ? 'rgba(0,212,190,0.18)' : 'rgba(239,68,68,0.18)'}`,
                      borderRadius: 12,
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{card.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: card.ok ? '#00D4BE' : '#F87171' }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {!policyPassed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '1rem', background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.18)',
                      borderRadius: 10, marginBottom: '1.5rem',
                      fontSize: '0.8125rem', color: '#F87171', lineHeight: 1.6,
                    }}
                  >
                    <strong>Reverted:</strong> ${amountEth} exceeds your single-tx limit of ${POLICY_LIMIT_ETH}.
                  </motion.div>
                )}

                <div style={{
                  fontFamily: 'monospace', fontSize: '0.75rem',
                  padding: '1rem', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                  marginBottom: '1.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.4rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)' }}>
                    <span>Amount</span><span style={{ color: '#fff' }}>${amountEth}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)' }}>
                    <span>Hash</span><span style={{ color: '#fff' }}>{txHash || 'N/A (Reverted)'}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setStatus('idle'); setView('dashboard'); }}
                  style={{
                    width: '100%', padding: '0.875rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontWeight: 700,
                    fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >← Back to Dashboard</motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}

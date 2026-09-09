'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { registerPasskey } from '../../lib/webauthn/register';
import { authenticatePasskey } from '../../lib/webauthn/authenticate';
import { encodePacked, keccak256, parseEther, formatEther } from 'viem';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';
import { usePasskeyAccountState, useExecuteTransaction } from '../../hooks/usePasskeyAccount';
import AnimatedBackground from '../components/AnimatedBackground';
import FeaturesCarousel from '../components/FeaturesCarousel';
import Footer from '../components/Footer';
import { SubscriptionCard } from '../components/SubscriptionCard';
import ThemeToggle from '../components/ThemeToggle';
import Spinner, { SpinnerInline } from '../components/Spinner';
import InfiniteMarquee from '../components/InfiniteMarquee';
import FlippingWord from '../components/FlippingWord';
import OrbitalFlow from '../components/OrbitalFlow';
import { CONTRACT_ADDRESSES } from '../../lib/chain/config';

const DEFAULT_SINGLE_TX_LIMIT_ETH = 1000;

const pageTransition = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

/* ─── Shared card style ──────────────────────────────────────────── */
const glass: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 20,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

export default function App() {
  const [view, setView] = useState<'landing' | 'register' | 'dashboard' | 'composer' | 'result'>('landing');
  const [credId, setCredId] = useState('');
  const [amountEth, setAmountEth] = useState('0.1');
  const { status, setStatus, txHash, setTxHash } = useTransactionStatus();
  const [policyPassed, setPolicyPassed] = useState<boolean | null>(null);
  const [feeToast, setFeeToast] = useState<string | null>(null);

  const { isConnected, walletAddress, balance, singleTxLimitEth, isRegistered, txFeeWei } = usePasskeyAccountState();
  const { execute } = useExecuteTransaction();

  const currentLimit = singleTxLimitEth ? parseFloat(singleTxLimitEth) : DEFAULT_SINGLE_TX_LIMIT_ETH;
  const protocolFeeEth = txFeeWei ? formatEther(txFeeWei) : '0.0001';
  const targetAmountNum = parseFloat(amountEth) || 0;
  const totalEthRequired = (targetAmountNum + parseFloat(protocolFeeEth)).toFixed(4);

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
      const recipient = (CONTRACT_ADDRESSES.demoTarget || '0x0000000000000000000000000000000000000001') as `0x${string}`;
      const amount = parseEther(amountEth || '0');
      const challengeHex = keccak256(encodePacked(['address', 'uint256', 'uint256'], [recipient, amount, nonce]));
      
      const authResult = await authenticatePasskey(credId, new Uint8Array(Buffer.from(challengeHex.slice(2), 'hex')));

      setStatus('sending');
      await new Promise(r => setTimeout(r, 900));

      if (targetAmountNum > currentLimit) {
        setPolicyPassed(false); 
        setStatus('error'); 
        setView('result'); 
        return;
      }
      
      setPolicyPassed(true);
      setStatus('mining');

      // Trigger fee notification toast
      setFeeToast(`This transaction includes a ${protocolFeeEth} test-ETH protocol fee sent to the treasury wallet (${CONTRACT_ADDRESSES.treasuryWallet.slice(0, 6)}...${CONTRACT_ADDRESSES.treasuryWallet.slice(-4)}).`);

      // Execute on-chain transaction
      execute(recipient, amountEth, {
        authenticatorData: `0x${Buffer.from(authResult.authenticatorData).toString('hex')}`,
        clientDataJSON: `0x${Buffer.from(authResult.clientDataJSON).toString('hex')}`,
        r: `0x${authResult.r}`,
        s: `0x${authResult.s}`,
      });

      await new Promise(r => setTimeout(r, 900));
      setStatus('success');
      setTxHash('0xsimulatedtxhash...');
      setView('result');
    } catch {
      setStatus('idle');
    }
  }, [credId, amountEth, targetAmountNum, currentLimit, protocolFeeEth, execute, setStatus, setTxHash]);

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
                  display: 'flex', alignItems: 'center',
                  padding: '0.875rem 2rem',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  background: 'var(--nav-bg)',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.35s ease, border-color 0.35s ease',
                }}
              >
                {/* Brand — left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, color: '#060608', fontSize: '0.8rem',
                    letterSpacing: '-0.02em',
                  }}>PG</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1 }}>PasskeyGuard</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>STYLUS // WEB3 IDENTITY</div>
                  </div>
                </div>

                {/* Nav links — ABSOLUTELY CENTERED */}
                <div className="hide-mobile" style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}>
                  {[
                    { label: 'Features', href: '#features' },
                    { label: 'GitHub', href: 'https://github.com/Akulbanxal/PasskeyGuard-Stylus', external: true },
                    { label: 'Docs', href: '#' },
                    { label: 'Pricing', href: '#pricing' },
                  ].map(l => (
                    <a key={l.label}
                       href={l.href}
                       target={(l as {external?: boolean}).external ? '_blank' : undefined}
                       rel={(l as {external?: boolean}).external ? 'noreferrer' : undefined}
                       style={{
                         color: 'var(--text-2)', fontSize: '0.75rem', textDecoration: 'none',
                         padding: '0.4rem 0.9rem', borderRadius: 8,
                         fontFamily: 'var(--font-mono)', fontWeight: 600,
                         letterSpacing: '0.06em', textTransform: 'uppercase',
                         transition: 'color 0.15s, background 0.15s',
                       }}
                       onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
                       onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent'; }}
                    >{l.label}</a>
                  ))}
                </div>

                {/* Right: Toggle + Connect — pushed to far right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', flexShrink: 0 }}>
                  <ThemeToggle />
                  <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                </div>
              </motion.nav>

              {/* ── Hero Section ── */}
              <section className="hero-full" style={{ paddingTop: '4.5rem' }}>
                {/* Animated beam sweep */}
                <div className="hero-beam" />

                {/* Hero horizontal line accents */}
                <div style={{
                  position: 'absolute', top: '50%', left: 0, right: 0,
                  height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,212,190,0.08), rgba(79,142,247,0.06), transparent)',
                  pointerEvents: 'none',
                }} />

                <div className="hero-inner">
                  {/* Left: Text column */}
                  <div>
                    {/* Live badge row */}
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.25rem', flexWrap: 'wrap' }}
                    >
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'var(--teal)',
                        background: 'rgba(0,212,190,0.1)',
                        border: '1px solid rgba(0,212,190,0.28)',
                        borderRadius: 100, padding: '0.35rem 0.95rem',
                        cursor: 'default', fontFamily: 'var(--font-mono)',
                        boxShadow: '0 0 20px rgba(0,212,190,0.15)',
                      }}>
                        ✦ Arbitrum Stylus
                      </span>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
                      }}>
                        <motion.div
                          animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                          style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', flexShrink: 0 }}
                        />
                        LIVE // SEPOLIA
                      </span>
                      <span style={{
                        fontSize: '0.65rem', color: 'var(--text-3)',
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: 100, padding: '0.3rem 0.85rem',
                      }}>
                        P-256 ECDSA
                      </span>
                    </motion.div>

                    {/* H1 — massive */}
                    <motion.h1
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.18 }}
                      className="hero-h1 gradient-text-hero"
                    >
                      Passkey<br />
                      <FlippingWord words={['Secured', 'Verified', 'Sovereign', 'Immutable']} /><br />
                      Web3<br />
                      <span style={{ opacity: 0.55 }}>Identity.</span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.35 }}
                      className="hero-sub"
                    >
                      Your biometric signs. The chain decides. No seed phrases,
                      no custody — just your fingerprint and Arbitrum Stylus P-256
                      ECDSA on-chain.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.48 }}
                      style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.04, boxShadow: '0 16px 50px rgba(0,212,190,0.55)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRegister}
                        style={{
                          background: 'linear-gradient(135deg, #00D4BE 0%, #4F8EF7 100%)',
                          color: '#04040A', border: 'none', borderRadius: 14,
                          padding: '1rem 2.25rem', fontWeight: 800,
                          fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', cursor: 'pointer',
                          boxShadow: '0 8px 32px rgba(0,212,190,0.32)',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        ✦ Create Account
                      </motion.button>
                      <motion.a
                        href="https://github.com/Akulbanxal/PasskeyGuard-Stylus"
                        target="_blank" rel="noreferrer"
                        whileHover={{ scale: 1.04, borderColor: 'rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-1)', border: '1px solid var(--border)',
                          borderRadius: 14, padding: '1rem 2.25rem',
                          fontWeight: 600, fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', cursor: 'pointer',
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
                          transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                        }}
                      >
                        View on GitHub →
                      </motion.a>
                    </motion.div>

                    {/* Stats chips */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.62 }}
                      style={{
                        display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
                        paddingTop: '2rem', borderTop: '1px solid var(--border)',
                      }}
                    >
                      {[
                        { label: 'Signature', value: 'P-256 ECDSA' },
                        { label: 'Runtime', value: 'Stylus WASM' },
                        { label: 'Auth', value: 'WebAuthn L2' },
                        { label: 'Chain', value: 'Arbitrum' },
                      ].map(stat => (
                        <div key={stat.label}>
                          <div style={{ fontSize: '0.58rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>{stat.label}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>{stat.value}</div>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Right: Orbital Flow Diagram — large */}
                  <motion.div
                    initial={{ opacity: 0, x: 60, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    style={{
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* Glow halo behind diagram */}
                    <div style={{
                      position: 'absolute', width: 480, height: 480,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(0,212,190,0.12) 0%, rgba(79,142,247,0.08) 50%, transparent 70%)',
                      filter: 'blur(40px)',
                      pointerEvents: 'none',
                    }} />
                    <OrbitalFlow protocolFeeEth={protocolFeeEth} />
                  </motion.div>
                </div>
              </section>

              {/* ── Infinite Marquee ── */}
              <InfiniteMarquee />

              {/* ── Features Carousel ── */}
              <FeaturesCarousel />

              {/* ── Subscription Section on Landing ── */}
              <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem 6rem' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                  <SubscriptionCard />
                </div>
              </section>

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
              <div style={{ ...glass, padding: '3rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>

                {/* Spinner — pink/blue gradient matching background */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                  {credId ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10B981, #00D4BE)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.25rem',
                      }}
                    >
                      ✅
                    </motion.div>
                  ) : (
                    /* Large 80px spinner using same pink-to-blue palette */
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(to bottom left, #ec4899, #3b82f6)',
                        padding: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: 'var(--bg-1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem',
                      }}>🔐</div>
                    </motion.div>
                  )}
                </div>

                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem', letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
                  {credId ? 'Registration Complete' : 'Device Registration'}
                </h2>
                <p style={{ color: 'var(--text-2)', marginBottom: '2rem', lineHeight: 1.7 }}>
                  {credId
                    ? 'Your passkey has been registered securely. Redirecting to your dashboard...'
                    : 'Follow your browser prompt to register with Face ID or Touch ID.'}
                </p>

                {/* Loading indicator — use Spinner */}
                {!credId && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Spinner label="Awaiting biometric…" />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, color: '#00D4BE',
                    background: 'rgba(0,212,190,0.08)', border: '1px solid rgba(0,212,190,0.2)',
                    borderRadius: 100, padding: '0.3rem 0.9rem',
                  }}>● Passkey Active</span>
                  <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                </div>
              </div>

              <div style={{
                maxWidth: 1200, margin: '0 auto',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
              }}>
                {/* Subscription Card Component */}
                <SubscriptionCard />

                <div style={{
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
                        {CONTRACT_ADDRESSES.passkeyAccount !== '0x0000000000000000000000000000000000000000'
                          ? `${CONTRACT_ADDRESSES.passkeyAccount.slice(0, 6)}...${CONTRACT_ADDRESSES.passkeyAccount.slice(-4)}`
                          : '0x000...0001'}
                      </div>
                      <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
                        {balance ? balance.formatted.slice(0, 6) : '0.000'}
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.5em', marginLeft: '0.3em' }}>ETH</span>
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
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>Single Tx Limit</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00D4BE', fontSize: '0.9rem' }}>
                        {currentLimit} ETH
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
              </div>
            </motion.div>
          )}

          {/* ════════════════ COMPOSER ════════════════ */}
          {view === 'composer' && (
            <motion.div key="composer" {...pageTransition}
              style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
            >
              <div style={{ ...glass, padding: '2.5rem', maxWidth: 520, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <button
                    onClick={() => setView('dashboard')}
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }}
                  >←</button>
                  <h2 style={{ fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.025em' }}>Send Funds</h2>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Recipient Address</label>
                  <input
                    type="text" disabled
                    defaultValue={CONTRACT_ADDRESSES.demoTarget !== '0x0000000000000000000000000000000000000000' ? CONTRACT_ADDRESSES.demoTarget : '0x0000000000000000000000000000000000000001'}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                      padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.5)',
                      fontFamily: 'monospace', fontSize: '0.8rem', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Transfer Amount (ETH)</label>
                  <input
                    type="number" step="0.01" value={amountEth}
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

                {/* Tenderly-style Fee & Cost Breakdown */}
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.8125rem'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.2rem' }}>
                    Cost & Fee Breakdown
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                    <span>Target Transfer:</span>
                    <span style={{ fontFamily: 'monospace', color: '#fff' }}>{amountEth || '0'} ETH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#EC4899' }}>💎 Protocol Fee (Treasury):</span>
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#EC4899', fontWeight: 600 }}>{protocolFeeEth} ETH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                    <span>Est. Network Gas:</span>
                    <span style={{ fontFamily: 'monospace', color: '#10B981' }}>~0.00005 ETH</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff' }}>
                    <span>Total Required:</span>
                    <span style={{ fontFamily: 'monospace', color: '#00D4BE' }}>~{totalEthRequired} ETH</span>
                  </div>
                </div>

                {/* Policy strip */}
                <motion.div
                  animate={{
                    borderColor: targetAmountNum > currentLimit ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,190,0.35)',
                    background: targetAmountNum > currentLimit ? 'rgba(239,68,68,0.06)' : 'rgba(0,212,190,0.05)',
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.875rem 1rem', borderRadius: 10,
                    border: '1px solid', marginBottom: '1.5rem', fontSize: '0.875rem',
                    color: targetAmountNum > currentLimit ? '#F87171' : '#00D4BE',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>
                    {targetAmountNum > currentLimit ? '⚠️' : '✓'}
                  </span>
                  {targetAmountNum > currentLimit
                    ? `Exceeds single tx limit (${currentLimit} ETH) — subscribe to Premium for 5× limits.`
                    : 'Within policy limits. Ready to sign.'}
                </motion.div>

                <motion.button
                  whileHover={status === 'idle' ? { scale: 1.02, boxShadow: '0 12px 36px rgba(0,212,190,0.4)' } : {}}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAuthenticate}
                  disabled={status !== 'idle'}
                  style={{
                    width: '100%', padding: '1rem',
                    background: status !== 'idle'
                      ? 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(59,130,246,0.2))'
                      : 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    color: status !== 'idle' ? 'rgba(255,255,255,0.75)' : '#060608',
                    border: status !== 'idle' ? '1px solid rgba(236,72,153,0.3)' : 'none',
                    borderRadius: 12, fontWeight: 800,
                    fontSize: '1rem', cursor: status !== 'idle' ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    boxShadow: status === 'idle' ? '0 4px 16px rgba(0,212,190,0.15)' : 'none',
                    marginBottom: '0',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {status === 'idle' ? (
                    <>🔐 Authenticate &amp; Send</>
                  ) : (
                    <>
                      <SpinnerInline />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                        {status === 'authenticating' ? 'Awaiting Biometric…'
                          : status === 'sending' ? 'Signing P-256…'
                          : 'Broadcasting…'}
                      </span>
                    </>
                  )}
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
                        { label: 'Biometric Signature',         active: status === 'authenticating',               done: ['sending','mining','success'].includes(status as string) },
                        { label: 'Stylus P-256 Verification',   active: status === 'sending',                      done: ['mining','success'].includes(status as string) },
                        { label: `Protocol Fee (${protocolFeeEth} ETH → Treasury)`, active: status === 'mining', done: (status as string) === 'success' },
                      ].map((step, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: step.active
                            ? 'linear-gradient(135deg, rgba(236,72,153,0.07), rgba(59,130,246,0.07))'
                            : step.done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${
                            step.active ? 'rgba(236,72,153,0.25)'
                            : step.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'
                          }`,
                          borderRadius: 10,
                          transition: 'all 0.3s ease',
                        }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{step.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {step.active && <SpinnerInline />}
                            <motion.span
                              style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                                color: step.done ? '#10B981' : step.active ? '#ec4899' : 'var(--text-3)',
                              }}
                              animate={step.active ? { opacity: [1, 0.4, 1] } : {}}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            >
                              {step.done ? 'DONE ✓' : step.active ? 'ACTIVE' : 'PENDING'}
                            </motion.span>
                          </div>
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

                {/* Protocol Fee Toast */}
                {feeToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '0.875rem 1rem',
                      background: 'rgba(236,72,153,0.1)',
                      border: '1px solid rgba(236,72,153,0.3)',
                      borderRadius: 12,
                      marginBottom: '1.5rem',
                      fontSize: '0.8125rem',
                      color: '#F472B6',
                      lineHeight: 1.5
                    }}
                  >
                    💎 <strong>Protocol Fee Notification:</strong> {feeToast}
                  </motion.div>
                )}

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
                    <strong>Reverted:</strong> {amountEth} ETH exceeds your limit of {currentLimit} ETH. Upgrade to Premium Tier for 5x limits.
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
                    <span>Amount</span><span style={{ color: '#fff' }}>{amountEth} ETH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)' }}>
                    <span>Protocol Fee</span><span style={{ color: '#EC4899' }}>{protocolFeeEth} ETH</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)' }}>
                    <span>Tx Hash</span><span style={{ color: '#fff' }}>{txHash || 'N/A (Reverted)'}</span>
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

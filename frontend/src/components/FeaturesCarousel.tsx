'use client';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';

const features = [
  {
    emoji: '🔐',
    tag: 'Authentication',
    title: 'Biometric Signing',
    desc: 'Sign every transaction with Face ID or Touch ID. Your passkey never leaves your device\'s secure enclave — hardware-level security by default.',
    accent: '#00D4BE',
    stat: 'WebAuthn L2',
    num: '01',
  },
  {
    emoji: '⚡',
    tag: 'On-Chain Verification',
    title: 'Stylus P-256 Verifier',
    desc: 'P-256 ECDSA signatures verified on-chain via Arbitrum Stylus WASM. 10× cheaper than an equivalent Solidity implementation.',
    accent: '#4F8EF7',
    stat: 'Arbitrum Stylus',
    num: '02',
  },
  {
    emoji: '🛡️',
    tag: 'Policy Engine',
    title: 'Smart Spend Limits',
    desc: 'Set per-transaction spending limits in Solidity. Every transfer is policy-checked before the signature is ever accepted on-chain.',
    accent: '#8B5CF6',
    stat: 'PolicyManager.sol',
    num: '03',
  },
  {
    emoji: '🔒',
    tag: 'Zero Trust',
    title: 'No Custody. No Backend.',
    desc: 'No private keys, no seed phrases, no custodian. Your biometric is the only key. The chain is the only authority that matters.',
    accent: '#F59E0B',
    stat: 'Self-Sovereign',
    num: '04',
  },
  {
    emoji: '💎',
    tag: 'Monetization',
    title: 'Premium Subscription',
    desc: 'Unlock 5× transaction limits with a 30-day on-chain subscription. Fees route directly to the treasury wallet — verifiable on Arbiscan.',
    accent: '#EC4899',
    stat: 'SubscriptionManager.sol',
    num: '05',
  },
];

export default function FeaturesCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [Autoplay({ delay: 4200, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <section id="features" style={{ padding: '5rem 0 6rem', position: 'relative', zIndex: 1 }}>
      {/* Section header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', marginBottom: '3.5rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--teal)',
            background: 'var(--teal-dim)',
            border: '1px solid rgba(0,212,190,0.25)',
            borderRadius: 100, padding: '0.3rem 0.9rem', marginBottom: '1.25rem',
            fontFamily: 'var(--font-mono)',
          }}>
            <span>◆</span> How It Works
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 900,
            letterSpacing: '-0.045em', marginBottom: '1rem',
            color: 'var(--text-1)',
          }}>
            Every layer. <span style={{ color: 'var(--teal)' }}>Secured.</span>
          </h2>
          <p style={{
            color: 'var(--text-2)', maxWidth: 480,
            margin: '0 auto', lineHeight: 1.72, fontSize: '1rem',
          }}>
            PasskeyGuard stacks WebAuthn biometrics with on-chain P-256 verification — zero weak links, zero custody.
          </p>
        </motion.div>
      </div>

      {/* Embla viewport */}
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }} className="embla__container">
        <div style={{
          display: 'flex', gap: '1.25rem',
          paddingLeft: 'max(2rem, calc((100vw - 1200px) / 2))',
          paddingRight: '2rem',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.22 } }}
              style={{
                flex: '0 0 320px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 20, padding: '2rem',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden',
                userSelect: 'none',
                transition: 'border-color 0.25s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.accent}40`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}
            >
              {/* Background number */}
              <span style={{
                position: 'absolute', right: '-0.25rem', top: '-1rem',
                fontFamily: 'var(--font-display)',
                fontSize: '6rem', fontWeight: 900, lineHeight: 1,
                color: 'var(--text-1)', opacity: 0.035,
                userSelect: 'none', pointerEvents: 'none',
              }}>{f.num}</span>

              {/* Corner glow */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: 140, height: 140, borderRadius: '50%',
                background: `radial-gradient(circle, ${f.accent}1A 0%, transparent 70%)`,
                filter: 'blur(16px)', pointerEvents: 'none',
              }} />

              {/* Tag pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.68rem', fontWeight: 700,
                color: f.accent, background: `${f.accent}12`,
                border: `1px solid ${f.accent}28`,
                borderRadius: 100, padding: '0.25rem 0.75rem',
                marginBottom: '1.5rem', position: 'relative',
                fontFamily: 'var(--font-mono)',
              }}>
                {f.emoji} {f.tag}
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem', fontWeight: 800,
                marginBottom: '0.75rem', letterSpacing: '-0.035em',
                position: 'relative', color: 'var(--text-1)',
              }}>{f.title}</h3>
              <p style={{
                color: 'var(--text-2)', lineHeight: 1.7,
                fontSize: '0.875rem', position: 'relative',
              }}>{f.desc}</p>

              <div style={{
                marginTop: '2rem', paddingTop: '1.25rem',
                borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'relative',
              }}>
                <div style={{
                  height: 2, borderRadius: 2,
                  background: `linear-gradient(90deg, ${f.accent}, transparent)`,
                  width: '55%',
                }} />
                <span style={{
                  fontSize: '0.68rem', fontWeight: 700,
                  color: f.accent, letterSpacing: '0.06em',
                  textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                }}>{f.stat}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        justifyContent: 'center', marginTop: '2.5rem',
        alignItems: 'center',
      }}>
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            style={{
              width: i === selectedIndex ? 28 : 8,
              height: 8, borderRadius: 4,
              background: i === selectedIndex ? 'var(--teal)' : 'var(--border-hover)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  );
}

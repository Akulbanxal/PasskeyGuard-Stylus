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
  },
  {
    emoji: '⚡',
    tag: 'On-Chain Verification',
    title: 'Stylus P-256 Verifier',
    desc: 'P-256 ECDSA signatures verified on-chain via Arbitrum Stylus WASM. 10x cheaper than an equivalent Solidity implementation.',
    accent: '#4F8EF7',
    stat: 'Arbitrum Stylus',
  },
  {
    emoji: '🛡️',
    tag: 'Policy Engine',
    title: 'Smart Spend Limits',
    desc: 'Set per-transaction spending limits in Solidity. Every transfer is policy-checked before the signature is ever accepted on-chain.',
    accent: '#8B5CF6',
    stat: 'PolicyManager.sol',
  },
  {
    emoji: '🔒',
    tag: 'Zero Trust',
    title: 'No Custody. No Backend.',
    desc: 'No private keys, no seed phrases, no custodian. Your biometric is the only key. The chain is the only authority that matters.',
    accent: '#F59E0B',
    stat: 'Self-Sovereign',
  },
];

export default function FeaturesCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', dragFree: true },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', marginBottom: '3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#00D4BE',
            background: 'rgba(0,212,190,0.08)',
            border: '1px solid rgba(0,212,190,0.2)',
            borderRadius: 100, padding: '0.3rem 0.9rem', marginBottom: '1.25rem',
          }}>
            <span>◆</span> How It Works
          </span>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700,
            letterSpacing: '-0.03em', marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.55))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Every layer. Secured.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.45)', maxWidth: 480,
            margin: '0 auto', lineHeight: 1.7, fontSize: '1rem',
          }}>
            PasskeyGuard stacks WebAuthn biometrics with on-chain P-256 verification — zero weak links, zero custody.
          </p>
        </motion.div>
      </div>

      {/* Embla viewport */}
      <div ref={emblaRef} style={{ overflow: 'hidden', cursor: 'grab' }}>
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
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                flex: '0 0 320px',
                background: 'rgba(12,13,18,0.75)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 18, padding: '2rem',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                position: 'relative', overflow: 'hidden',
                userSelect: 'none',
              }}
            >
              {/* Corner glow */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: 120, height: 120, borderRadius: '50%',
                background: `radial-gradient(circle, ${f.accent}20 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }} />

              {/* Tag pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.7rem', fontWeight: 600,
                color: f.accent, background: `${f.accent}12`,
                border: `1px solid ${f.accent}28`,
                borderRadius: 100, padding: '0.25rem 0.7rem',
                marginBottom: '1.5rem', position: 'relative',
              }}>
                {f.emoji} {f.tag}
              </div>

              <h3 style={{
                fontSize: '1.2rem', fontWeight: 700,
                marginBottom: '0.75rem', letterSpacing: '-0.025em',
                position: 'relative',
              }}>{f.title}</h3>
              <p style={{
                color: 'rgba(255,255,255,0.48)', lineHeight: 1.68,
                fontSize: '0.875rem', position: 'relative',
              }}>{f.desc}</p>

              <div style={{
                marginTop: '2rem', paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'relative',
              }}>
                <div style={{
                  height: 2, borderRadius: 2,
                  background: `linear-gradient(90deg, ${f.accent}, transparent)`,
                  width: '55%',
                }} />
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  color: f.accent, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>{f.stat}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        justifyContent: 'center', marginTop: '2rem',
      }}>
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            style={{
              width: i === selectedIndex ? 24 : 8,
              height: 8, borderRadius: 4,
              background: i === selectedIndex ? '#00D4BE' : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  );
}

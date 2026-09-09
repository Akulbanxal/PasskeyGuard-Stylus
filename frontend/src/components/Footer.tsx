'use client';
import { motion } from 'framer-motion';
import { ExternalLink, Cpu, Shield, Zap, Lock } from 'lucide-react';

const PROTOCOL_LINKS = [
  { num: '01', label: 'Dashboard',            href: '#' },
  { num: '02', label: 'Policy Manager',       href: '#' },
  { num: '03', label: 'Transaction Composer', href: '#' },
  { num: '04', label: 'Subscription Tiers',   href: '#features' },
  { num: '05', label: 'Security Audit',       href: '#' },
  { num: '06', label: 'GitHub Repository',    href: 'https://github.com/Akulbanxal/PasskeyGuard-Stylus' },
];

const TECH_STACK = [
  { label: 'P-256 ECDSA',    sub: 'Signature Scheme',    icon: Shield, color: '#00D4BE' },
  { label: 'Stylus WASM',    sub: 'On-chain Runtime',     icon: Cpu,    color: '#4F8EF7' },
  { label: 'WebAuthn L2',    sub: 'Authentication',       icon: Zap,    color: '#8B5CF6' },
  { label: 'EIP-4337',       sub: 'Account Abstraction',  icon: Lock,   color: '#F59E0B' },
];

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-1)',
        transition: 'background 0.35s ease, border-color 0.35s ease',
        overflow: 'hidden',
        marginTop: '6rem',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 2rem 0' }}>
        {/* Main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.2fr 1.4fr',
            gap: '3rem',
            paddingBottom: '3.5rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.55 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 10, height: 10, background: 'var(--teal)', flexShrink: 0,
                borderRadius: 2,
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800, fontSize: '1.05rem',
                letterSpacing: '-0.03em', color: 'var(--text-1)',
              }}>
                PASSKEYGUARD
                <span style={{ color: 'var(--teal)' }}> // </span>
                SOVEREIGN WEB3 IDENTITY
              </span>
            </div>
            <p style={{
              color: 'var(--text-2)', fontSize: '0.875rem',
              lineHeight: 1.75, maxWidth: 340, marginBottom: '1.75rem',
            }}>
              Sign blockchain transactions with your biometric. P-256 ECDSA verified
              on-chain via Arbitrum Stylus. No seed phrases. No custody. No compromise.
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
              {[
                { label: 'RUST + STYLUS WASM', sub: '' },
                { label: 'ARBITRUM SEPOLIA', sub: '' },
              ].map(b => (
                <span key={b.label} style={{
                  padding: '0.3rem 0.75rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-2)',
                  borderRadius: 6,
                  fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '0.08em', color: 'var(--teal)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {b.label}
                </span>
              ))}
            </div>

            {/* Social links */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <motion.a
                href="https://github.com/Akulbanxal/PasskeyGuard-Stylus"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.08, borderColor: 'var(--teal)' }}
                style={{
                  width: 38, height: 38, borderRadius: 9,
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-2)', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.a>
            </div>
          </motion.div>

          {/* Protocol Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <h4 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: '0.75rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-1)', marginBottom: '1.5rem',
            }}>
              Protocol Nodes
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {PROTOCOL_LINKS.map((link, i) => (
                <motion.li
                  key={link.num}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                >
                  <motion.a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                    whileHover={{ color: 'var(--teal)', x: 3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      color: 'var(--text-2)', fontSize: '0.82rem',
                      textDecoration: 'none', transition: 'color 0.15s',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ color: 'var(--text-3)', fontSize: '0.68rem' }}>{link.num} //</span>
                    {link.label}
                    {link.href.startsWith('http') && <ExternalLink size={10} style={{ opacity: 0.5 }} />}
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Tech stack telemetry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.55, delay: 0.16 }}
          >
            <h4 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: '0.75rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-1)', marginBottom: '1.5rem',
            }}>
              Stylus Telemetry
            </h4>

            {/* Contract address block */}
            <div style={{
              padding: '1rem',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              marginBottom: '1.25rem',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
                NETWORK TARGET:
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem', fontWeight: 600 }}>
                Arbitrum Sepolia // Chain 421614
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
                SIGNATURE SCHEME:
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                P-256 SECP256R1 ON-CHAIN
              </div>
            </div>

            {/* Tech pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {TECH_STACK.map(t => {
                const Icon = t.icon;
                return (
                  <div key={t.label} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    fontSize: '0.78rem',
                  }}>
                    <Icon size={13} style={{ color: t.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{t.label}</span>
                    <span style={{ color: 'var(--text-3)', fontSize: '0.68rem', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{t.sub}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
          padding: '1.5rem 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
              BUILT EXCLUSIVELY FOR ARBITRUM STYLUS // NON-ERC721 SOVEREIGN DESIGN
            </span>
          </div>
          <span style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            PASSKEYGUARD © 2026 // PASSKEY-SECURED WEB3 IDENTITY PROTOCOL
          </span>
        </div>
      </div>

      {/* Brand watermark — LiquidPass style */}
      <div style={{
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        height: 'clamp(4rem, 8vw, 9rem)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        marginTop: '0.5rem',
      }}>
        <div
          className="footer-watermark"
          style={{
            transform: 'translateY(-8%)',
            background: 'linear-gradient(180deg, var(--text-1) 0%, transparent 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          PASSKEYGUARD
        </div>
      </div>
    </footer>
  );
}

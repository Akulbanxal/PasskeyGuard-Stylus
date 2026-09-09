'use client';
import { motion } from 'framer-motion';

/* ─── Brand logos as inline SVGs ─────────────────────────────────────────── */

const ArbitrumLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Arbitrum">
    <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 15L12 8L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const EthereumLogo = () => (
  <svg width="18" height="22" viewBox="0 0 32 52" fill="none" aria-label="Ethereum">
    <path d="M16 0L0 26.5L16 36L32 26.5L16 0Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M16 39.5L0 30L16 52L32 30L16 39.5Z" fill="currentColor"/>
  </svg>
);

const WebAuthnLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="WebAuthn">
    <ellipse cx="9" cy="7" rx="4" ry="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 17c0-2.21 1.79-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 11v2m0 4h.01M14 13a3 3 0 1 1 6 0v1h-6v-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RustLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Rust">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line
        key={i}
        x1={12 + 5 * Math.cos((deg * Math.PI) / 180)}
        y1={12 + 5 * Math.sin((deg * Math.PI) / 180)}
        x2={12 + 7 * Math.cos((deg * Math.PI) / 180)}
        y2={12 + 7 * Math.sin((deg * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

const SafeLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Safe">
    <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="1" y1="9" x2="3" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="1" y1="15" x2="3" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="21" y1="9" x2="23" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="21" y1="15" x2="23" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const P256Logo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="P-256 ECDSA">
    <path d="M12 2l3.5 6H20l-4 5 2 6-6-3.5L6 19l2-6-4-5h4.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const StylusLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Stylus WASM">
    <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 8l3 4-3 4M13 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FIDOLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="FIDO2">
    <path d="M12 3C8.69 3 6 5.69 6 9c0 2.12 1.1 3.99 2.76 5.09L8 21h8l-.76-6.91C16.9 12.99 18 11.12 18 9c0-3.31-2.69-6-6-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ─── Brand items ─────────────────────────────────────────────────────────── */
const brands = [
  { label: 'Arbitrum',  Icon: ArbitrumLogo, color: '#4F8EF7' },
  { label: 'Ethereum',  Icon: EthereumLogo, color: '#8B5CF6' },
  { label: 'Stylus',    Icon: StylusLogo,   color: '#00D4BE' },
  { label: 'WebAuthn',  Icon: WebAuthnLogo, color: '#10B981' },
  { label: 'Rust',      Icon: RustLogo,     color: '#F59E0B' },
  { label: 'FIDO2',     Icon: FIDOLogo,     color: '#EC4899' },
  { label: 'Safe',      Icon: SafeLogo,     color: '#00D4BE' },
  { label: 'P-256',     Icon: P256Logo,     color: '#4F8EF7' },
];

/* Quadruple for seamless infinite loop */
const items = [...brands, ...brands, ...brands, ...brands];

export default function InfiniteMarquee() {
  return (
    <div style={{
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      position: 'relative',
      padding: '2rem 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-1)',
      display: 'flex',
      alignItems: 'center',
      marginTop: '4rem',
    }}>
      {/* Fade edges */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '12%', height: '100%',
        background: 'linear-gradient(to right, var(--bg-1), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '12%', height: '100%',
        background: 'linear-gradient(to left, var(--bg-1), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
        style={{ display: 'flex', gap: '3.5rem', paddingRight: '3.5rem', alignItems: 'center' }}
      >
        {items.map((brand, i) => {
          const { Icon } = brand;
          return (
            <div
              key={i}
              title={brand.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: 'var(--text-3)',
                transition: 'color 0.25s',
                cursor: 'default',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = brand.color; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
            >
              <Icon />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}>
                {brand.label}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

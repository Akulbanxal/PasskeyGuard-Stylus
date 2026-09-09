'use client';
import { motion } from 'framer-motion';

/* ─── Real official brand logos via Simple Icons CDN ─────────────────────
   CDN: https://cdn.simpleicons.org/{slug}/{hex-color}
   Serving official SVG logos from the open-source simpleicons.org project.
──────────────────────────────────────────────────────────────────────────── */

interface Brand {
  label: string;
  /** `cdn` = Simple Icons CDN slug | `local` = /public/logos/{file} */
  type: 'cdn' | 'local';
  src: string;
  /** Accent colour shown on hover */
  accent: string;
  /** Default icon tint (hex, no #) — used as CDN color param for CDN type */
  tint: string;
}

const brands: Brand[] = [
  // Arbitrum — NOT in Simple Icons, using local official SVG
  { label: 'Arbitrum',    type: 'local', src: '/logos/arbitrum.svg', accent: '#28A0F0', tint: '9ca3af' },
  { label: 'Ethereum',    type: 'cdn',   src: 'ethereum',            accent: '#627EEA', tint: '9ca3af' },
  { label: 'Stylus',      type: 'cdn',   src: 'webassembly',         accent: '#9c7cfe', tint: '9ca3af' },
  { label: 'Optimism',    type: 'cdn',   src: 'optimism',            accent: '#FF0420', tint: '9ca3af' },
  { label: 'Polygon',     type: 'cdn',   src: 'polygon',             accent: '#7B3FE4', tint: '9ca3af' },
  { label: 'Rust',        type: 'cdn',   src: 'rust',                accent: '#F74C00', tint: '9ca3af' },
  // Safe — NOT in Simple Icons, using local official SVG
  { label: 'Safe',        type: 'local', src: '/logos/safe.svg',     accent: '#00856E', tint: '9ca3af' },
  { label: 'React',       type: 'cdn',   src: 'react',               accent: '#61DAFB', tint: '9ca3af' },
];

/* Quadruple the array for a seamless infinite loop */
const items = [...brands, ...brands, ...brands, ...brands];

export default function InfiniteMarquee() {
  return (
    <div style={{
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      position: 'relative',
      padding: '1.75rem 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-1)',
      display: 'flex',
      alignItems: 'center',
      marginTop: '4rem',
    }}>
      {/* Fade edges */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '10%', height: '100%',
        background: 'linear-gradient(to right, var(--bg-1), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '10%', height: '100%',
        background: 'linear-gradient(to left, var(--bg-1), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 38, ease: 'linear', repeat: Infinity }}
        style={{ display: 'flex', gap: '3.5rem', paddingRight: '3.5rem', alignItems: 'center' }}
      >
        {items.map((brand, i) => {
          const defaultSrc = brand.type === 'local'
            ? brand.src
            : `https://cdn.simpleicons.org/${brand.src}/${brand.tint}`;
          const hoverSrc = brand.type === 'local'
            ? brand.src  // local SVG — color set by filter on hover
            : `https://cdn.simpleicons.org/${brand.src}/${brand.accent.slice(1)}`;

          return (
            <div
              key={i}
              title={brand.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                flexShrink: 0,
                cursor: 'default',
                opacity: 0.55,
                transition: 'opacity 0.25s, transform 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.06)';
                const img = e.currentTarget.querySelector('img') as HTMLImageElement | null;
                if (img) {
                  img.src = hoverSrc;
                  if (brand.type === 'local') img.style.filter = 'none';
                }
                const label = e.currentTarget.querySelector('span') as HTMLSpanElement | null;
                if (label) label.style.color = brand.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '0.55';
                e.currentTarget.style.transform = 'scale(1)';
                const img = e.currentTarget.querySelector('img') as HTMLImageElement | null;
                if (img) {
                  img.src = defaultSrc;
                  if (brand.type === 'local') img.style.filter = 'grayscale(1) brightness(0.6)';
                }
                const label = e.currentTarget.querySelector('span') as HTMLSpanElement | null;
                if (label) label.style.color = 'var(--text-2)';
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaultSrc}
                alt={brand.label}
                width={26}
                height={26}
                style={{
                  objectFit: 'contain',
                  transition: 'filter 0.25s',
                  flexShrink: 0,
                  filter: brand.type === 'local' ? 'grayscale(1) brightness(0.6)' : 'none',
                }}
              />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.05rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-2)',
                whiteSpace: 'nowrap',
                transition: 'color 0.25s',
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

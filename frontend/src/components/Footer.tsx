'use client';
import { motion } from 'framer-motion';

const footerLinks = {
  Product: ['Dashboard', 'Send Funds', 'Policy Manager', 'Security Audit'],
  Technology: ['Arbitrum Stylus', 'WebAuthn', 'P-256 ECDSA', 'EIP-4337'],
  Resources: ['Documentation', 'GitHub', 'Security Findings', 'Deployment Addresses'],
};

const techBadges = [
  { label: 'Arbitrum', color: '#4F8EF7' },
  { label: 'Stylus', color: '#00D4BE' },
  { label: 'WebAuthn', color: '#8B5CF6' },
  { label: 'WASM', color: '#F59E0B' },
];

export default function Footer() {
  return (
    <footer style={{
      position: 'relative', zIndex: 1,
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backgroundColor: 'rgba(6,6,8,0.95)',
      backdropFilter: 'blur(20px)',
      padding: '4rem 2rem 2rem',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '3rem',
          marginBottom: '3rem',
        }}>
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#060608', fontSize: '0.9rem',
              }}>P</div>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.025em' }}>PasskeyGuard</span>
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem',
              lineHeight: 1.75, maxWidth: 270,
            }}>
              Passkey-secured on-chain accounts powered by Arbitrum Stylus and P-256 ECDSA verification.
            </p>

            {/* GitHub social */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              <motion.a
                href="https://github.com/Akulbanxal/PasskeyGuard-Stylus"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.1, borderColor: 'rgba(255,255,255,0.3)' }}
                style={{
                  width: 38, height: 38, borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'none', fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </motion.a>
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links], colIdx) => (
            <motion.div
              key={heading}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: colIdx * 0.08 }}
            >
              <h4 style={{
                fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.28)', marginBottom: '1.25rem',
              }}>{heading}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {links.map(link => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      whileHover={{ color: '#fff', x: 2 }}
                      style={{
                        color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem',
                        textDecoration: 'none', display: 'block', transition: 'color 0.15s',
                      }}
                    >{link}</motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.8125rem' }}>
            © 2026 PasskeyGuard. Built with ♥ on Arbitrum.
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {techBadges.map(b => (
              <span key={b.label} style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: b.color, background: `${b.color}12`,
                border: `1px solid ${b.color}28`,
                borderRadius: 100, padding: '0.2rem 0.65rem',
                letterSpacing: '0.03em',
              }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

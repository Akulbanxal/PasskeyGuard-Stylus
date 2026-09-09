'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { CheckCircle2, AlertCircle, Zap, Crown, Shield, Sparkles, Clock } from 'lucide-react';
import { CONTRACT_ADDRESSES, MONETIZATION_CONFIG } from '../../lib/chain/config';
import { subscriptionManagerAbi, policyManagerAbi } from '../../lib/chain/abi';

/* ─── Tier Data ──────────────────────────────────────────────────────────── */
const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    priceLabel: 'Always Free',
    period: null,
    badge: null,
    icon: Shield,
    accent: 'rgba(255,255,255,0.35)',
    features: [
      'P-256 ECDSA on-chain signing',
      'WebAuthn biometric auth',
      'Base transaction limits',
      'Policy manager access',
      'Arbitrum Sepolia testnet',
    ],
    limits: { singleTx: '1,000', daily: '5,000' },
    cta: 'Current Tier',
    disabled: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '0.001',
    priceLabel: '0.001 ETH',
    period: '/ 30 days',
    badge: 'Most Popular',
    icon: Crown,
    accent: '#00D4BE',
    features: [
      'Everything in Free',
      '5× transaction limits',
      '5× daily spending cap',
      'Priority policy processing',
      'Treasury fee routing',
      'Subscription NFT proof',
    ],
    limits: { singleTx: '5,000', daily: '25,000' },
    cta: 'Upgrade to Premium',
    disabled: false,
  },
] as const;

/* ─── Component ──────────────────────────────────────────────────────────── */
export const SubscriptionCard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  /* ── Contract reads ── */
  const { data: expiryTimestamp, refetch: refetchExpiry } = useReadContract({
    address: CONTRACT_ADDRESSES.subscriptionManager,
    abi: subscriptionManagerAbi,
    functionName: 'subscriptionExpiry',
    args: address ? [address] : undefined,
    query: { enabled: !!address && CONTRACT_ADDRESSES.subscriptionManager !== '0x0000000000000000000000000000000000000000' },
  });

  const { data: isActive, refetch: refetchIsActive } = useReadContract({
    address: CONTRACT_ADDRESSES.subscriptionManager,
    abi: subscriptionManagerAbi,
    functionName: 'isActive',
    args: address ? [address] : undefined,
    query: { enabled: !!address && CONTRACT_ADDRESSES.subscriptionManager !== '0x0000000000000000000000000000000000000000' },
  });

  const { data: singleTxLimit } = useReadContract({
    address: CONTRACT_ADDRESSES.policyManager,
    abi: policyManagerAbi,
    functionName: 'singleTxLimit',
    query: { enabled: CONTRACT_ADDRESSES.policyManager !== '0x0000000000000000000000000000000000000000' },
  });

  const { data: dailyLimit } = useReadContract({
    address: CONTRACT_ADDRESSES.policyManager,
    abi: policyManagerAbi,
    functionName: 'dailyLimit',
    query: { enabled: CONTRACT_ADDRESSES.policyManager !== '0x0000000000000000000000000000000000000000' },
  });

  /* ── Contract write ── */
  const { writeContract, data: txHash, isPending: isSubmitting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  React.useEffect(() => {
    if (isSuccess) {
      setToastType('success');
      setToastMessage('🎉 Premium activated! 5× spending limits unlocked for 30 days.');
      refetchExpiry();
      refetchIsActive();
      setTimeout(() => setToastMessage(null), 6000);
    }
  }, [isSuccess, refetchExpiry, refetchIsActive]);

  const handleSubscribe = () => {
    if (!isConnected || !address) {
      setToastType('error');
      setToastMessage('⚠️ Connect your wallet first to subscribe.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.subscriptionManager,
        abi: subscriptionManagerAbi,
        functionName: 'subscribe',
        value: MONETIZATION_CONFIG.monthlyFeeWei,
      });
    } catch (err: unknown) {
      console.error('Subscription error:', err);
    }
  };

  /* ── State helpers ── */
  const now = Math.floor(Date.now() / 1000);
  const expiry = expiryTimestamp ? Number(expiryTimestamp) : 0;
  const activeBool = Boolean(isActive) || expiry > now;
  const daysLeft = activeBool && expiry > now ? Math.ceil((expiry - now) / 86400) : 0;

  const baseSingleTx = singleTxLimit ? Number(formatEther(singleTxLimit)).toLocaleString() : '1,000';
  const baseDaily    = dailyLimit    ? Number(formatEther(dailyLimit)).toLocaleString()    : '5,000';
  const premSingleTx = singleTxLimit ? Number(formatEther(singleTxLimit * BigInt(5))).toLocaleString() : '5,000';
  const premDaily    = dailyLimit    ? Number(formatEther(dailyLimit * BigInt(5))).toLocaleString()    : '25,000';

  /* ── Active tier override ── */
  if (activeBool) {
    (TIERS[1] as { cta: string }).cta = 'Extend Premium (+30 days)';
    (TIERS[1] as { limits: { singleTx: string; daily: string } }).limits = { singleTx: premSingleTx, daily: premDaily };
  } else {
    (TIERS[0] as { limits: { singleTx: string; daily: string } }).limits = { singleTx: baseSingleTx, daily: baseDaily };
    (TIERS[1] as { limits: { singleTx: string; daily: string } }).limits = { singleTx: premSingleTx, daily: premDaily };
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <span
          className="pill"
          style={{
            color: 'var(--teal)',
            background: 'var(--teal-dim)',
            border: '1px solid rgba(0,212,190,0.28)',
            marginBottom: '1.25rem',
            display: 'inline-flex',
          }}
        >
          <Sparkles size={12} /> Subscription Tiers
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: '0.875rem',
          }}
          className="gradient-text"
        >
          Choose Your Access Level
        </h2>
        <p style={{ color: 'var(--text-2)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Unlock 5× transaction limits with a 30-day premium subscription. All fees route on-chain to the treasury.
        </p>

        {/* Active subscription status */}
        {activeBool && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '1.25rem',
              padding: '0.5rem 1.25rem',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 100,
              color: '#10B981', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <CheckCircle2 size={14} />
            Premium Active — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          </motion.div>
        )}
      </motion.div>

      {/* Tier cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        {TIERS.map((tier, i) => {
          const Icon = tier.icon;
          const isPremium = tier.id === 'premium';
          const isCurrentActive = (isPremium && activeBool) || (!isPremium && !activeBool);

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ delay: i * 0.12, duration: 0.55 }}
              className={`pricing-card${isPremium ? ' featured' : ''}`}
              style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
            >
              {/* Featured glow */}
              {isPremium && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 200, height: 200,
                  background: 'radial-gradient(circle at top right, rgba(0,212,190,0.12) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Badge */}
              {tier.badge && (
                <div style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#060608', background: 'var(--teal)',
                  borderRadius: 100, padding: '0.28rem 0.75rem',
                }}>
                  {tier.badge}
                </div>
              )}

              {/* Icon + tier name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${tier.accent}14`,
                  border: `1px solid ${tier.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: tier.accent,
                }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.025em' }}>
                    {tier.name}
                  </div>
                  {isCurrentActive && (
                    <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600, marginTop: 2 }}>
                      ● Active
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                {tier.price === '0' ? (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-2)' }}>
                    Free
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--teal)', marginBottom: 4 }}>ETH</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-1)' }}>
                      0.001
                    </span>
                    <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{tier.period}</span>
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  {tier.price === '0' ? 'No cost, ever' : '≈ Arbitrum Sepolia testnet'}
                </div>
              </div>

              {/* Limits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Per Tx', val: tier.limits.singleTx + ' ETH', icon: Zap },
                  { label: 'Daily', val: tier.limits.daily + ' ETH', icon: Clock },
                ].map(({ label, val, icon: LimitIcon }) => (
                  <div key={label} style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-3)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
                      <LimitIcon size={10} /> {label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: isPremium ? 'var(--teal)' : 'var(--text-2)' }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature list */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-2)' }}>
                    <CheckCircle2
                      size={14}
                      style={{ color: isPremium ? 'var(--teal)' : 'var(--text-3)', flexShrink: 0 }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {isPremium ? (
                <motion.button
                  onClick={handleSubscribe}
                  disabled={isSubmitting || isConfirming}
                  whileHover={!isSubmitting && !isConfirming ? { scale: 1.02, boxShadow: '0 8px 32px rgba(0,212,190,0.4)' } : {}}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: 'none', borderRadius: 12,
                    background: isSubmitting || isConfirming
                      ? 'rgba(0,212,190,0.4)'
                      : 'linear-gradient(135deg, #00D4BE, #4F8EF7)',
                    color: '#060608', fontWeight: 800,
                    fontSize: '0.9rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 20px rgba(0,212,190,0.3)',
                    transition: 'opacity 0.2s',
                    opacity: isSubmitting || isConfirming ? 0.8 : 1,
                  }}
                >
                  {isSubmitting || isConfirming ? (
                    <>
                      <div style={{
                        width: 14, height: 14,
                        border: '2px solid rgba(0,0,0,0.3)',
                        borderTop: '2px solid #060608',
                        borderRadius: '50%',
                        animation: 'spin-slow 1s linear infinite',
                      }} />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Crown size={16} />
                      {activeBool ? 'Extend Premium (+30 days)' : 'Upgrade to Premium'}
                    </>
                  )}
                </motion.button>
              ) : (
                <div style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text-3)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  background: 'transparent',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {isConnected ? 'Current Tier' : 'Connect Wallet'}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            style={{
              position: 'fixed', bottom: '2rem', left: '50%',
              transform: 'translateX(-50%)',
              background: toastType === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${toastType === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
              borderRadius: 12, padding: '0.875rem 1.5rem',
              color: toastType === 'success' ? '#10B981' : '#EF4444',
              fontSize: '0.875rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backdropFilter: 'blur(16px)',
              zIndex: 9999, maxWidth: 480,
              boxShadow: `0 8px 32px ${toastType === 'success' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`,
            }}
          >
            {toastType === 'success'
              ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              : <AlertCircle size={16} style={{ flexShrink: 0 }} />
            }
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

'use client';

import { motion } from 'framer-motion';
import { type Tier, TIER_THRESHOLDS, deriveTier } from '@/store/authStore';

interface TierBadgeProps {
  balance?: number;
  tier?: Tier;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG: Record<Tier, {
  label: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
}> = {
  STREET: {
    label: 'STREET',
    color: 'var(--tier-street)',
    glow: '0 0 16px rgba(180,180,180,0.2)',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.12)',
  },
  PLAYER: {
    label: 'PLAYR',
    color: 'var(--tier-player)',
    glow: '0 0 20px rgba(212,255,30,0.18)',
    bg: 'rgba(212,255,30,0.06)',
    border: 'rgba(212,255,30,0.2)',
  },
  LEGEND: {
    label: 'LEGEND',
    color: 'var(--tier-legend)',
    glow: '0 0 24px rgba(255,200,50,0.22)',
    bg: 'rgba(255,200,50,0.06)',
    border: 'rgba(255,200,50,0.24)',
  },
};

const SIZE_CLASSES = {
  sm: { fontSize: '0.6rem', px: '0.5rem', py: '0.2rem', gap: '0.3rem', dot: '4px' },
  md: { fontSize: '0.65rem', px: '0.65rem', py: '0.28rem', gap: '0.4rem', dot: '5px' },
  lg: { fontSize: '0.75rem', px: '0.8rem', py: '0.35rem', gap: '0.5rem', dot: '6px' },
};

export default function TierBadge({ balance, tier: tierProp, size = 'md' }: TierBadgeProps) {
  const tier: Tier = tierProp ?? (balance !== undefined ? deriveTier(balance) : 'STREET');
  const cfg = TIER_CONFIG[tier];
  const sz = SIZE_CLASSES[size];
  const { next } = TIER_THRESHOLDS[tier];

  return (
    <motion.div
      title={next ? `Next tier: ${next}` : 'Maximum tier achieved'}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sz.gap,
        padding: `${sz.py} ${sz.px}`,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '2px',
        boxShadow: cfg.glow,
        letterSpacing: '0.14em',
        fontFamily: 'var(--font-sp-mono)',
        fontSize: sz.fontSize,
        fontWeight: 500,
        color: cfg.color,
        textTransform: 'uppercase',
        userSelect: 'none',
      }}
    >
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          display: 'block',
          width: sz.dot,
          height: sz.dot,
          borderRadius: '50%',
          background: cfg.color,
          boxShadow: cfg.glow,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </motion.div>
  );
}

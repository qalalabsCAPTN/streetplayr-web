'use client';

import { motion } from 'framer-motion';
import { type User, deriveTier, selectTierProgress, useAuthStore } from '@/store/authStore';
import TierBadge from './TierBadge';

interface MembershipCardProps {
  user: User;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
  });
}

function formatBalance(n: number) {
  return n.toLocaleString('en-IN');
}

export default function MembershipCard({ user }: MembershipCardProps) {
  const progress = useAuthStore(selectTierProgress);
  const tier = deriveTier(user.sprrBalance);

  return (
    <motion.div
      className="membership-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Membership card"
    >
      {/* Shimmer sweep */}
      <div className="membership-card-shimmer" aria-hidden="true" />

      {/* Grain overlay */}
      <div className="membership-card-grain" aria-hidden="true" />

      {/* Top row */}
      <div className="membership-card-top">
        <div className="membership-card-logo">
          <span>SP</span>
        </div>
        <TierBadge balance={user.sprrBalance} size="sm" />
      </div>

      {/* Balance */}
      <div className="membership-card-balance-row">
        <motion.span
          className="membership-card-balance"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {formatBalance(user.sprrBalance)}
        </motion.span>
        <span className="membership-card-balance-unit">SP-RR</span>
      </div>

      {/* Tier progress bar */}
      <div className="membership-card-progress-track" aria-label={`Tier progress: ${Math.round(progress * 100)}%`}>
        <motion.div
          className="membership-card-progress-fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left' }}
          data-tier={tier}
        />
      </div>

      {/* Bottom row */}
      <div className="membership-card-bottom">
        <div>
          <p className="membership-card-label">Member</p>
          <p className="membership-card-name">{user.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="membership-card-label">Since</p>
          <p className="membership-card-since">{formatDate(user.memberSince)}</p>
        </div>
      </div>
    </motion.div>
  );
}

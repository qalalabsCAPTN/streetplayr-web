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
      className="relative bg-gradient-to-br from-[#2a2230] to-[#1b1620] border border-white/[0.08] p-5 overflow-hidden rounded-xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Membership card"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-2xl uppercase text-[#ddb7ff] tracking-wide">
          <span>SP</span>
        </div>
        <TierBadge balance={user.sprrBalance} size="sm" />
      </div>

      {/* Balance */}
      <div className="flex items-baseline gap-2 mb-4">
        <motion.span
          className="font-display text-4xl uppercase text-[#eadfed] tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {formatBalance(user.sprrBalance)}
        </motion.span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">SP-RR</span>
      </div>

      {/* Tier progress bar */}
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-4 overflow-hidden" aria-label={`Tier progress: ${Math.round(progress * 100)}%`}>
        <motion.div
          className="h-full bg-[#ddb7ff] rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left' }}
          data-tier={tier}
        />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">Member</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#eadfed] mt-0.5">{user.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">Since</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/60 mt-0.5">{formatDate(user.memberSince)}</p>
        </div>
      </div>
    </motion.div>
  );
}

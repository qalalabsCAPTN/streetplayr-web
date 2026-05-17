'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';
import WalletHistoryItem from '@/components/profile/WalletHistoryItem';

function formatBalance(n: number) {
  return n.toLocaleString('en-IN');
}

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const transactions = useAuthStore((s) => s.transactions);
  const progress = useAuthStore(selectTierProgress);

  if (!user) return null;

  const tier = deriveTier(user.sprrBalance);
  const tierInfo = TIER_THRESHOLDS[tier];

  return (
    <div className="max-w-[1200px]">
      {/* ═══ HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 border-l-4 border-[#ddb7ff] pl-6"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ddb7ff] block mb-2">
          [ FINANCIAL // TERMINAL ]
        </span>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
          Universal Wallet
        </h1>
      </motion.header>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">

        {/* ── Balance Card (8 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-8 bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none select-none">
            <span className="font-display text-[120px] text-white leading-none">$</span>
          </div>

          <div className="relative z-10">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-4">SP-RR Balance</span>

            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
                {formatBalance(user.sprrBalance)}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">SP-RR</span>
            </div>

            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff]/[0.6]">
              {TIER_THRESHOLDS[tier].label} TIER · {Math.round(progress * 100)}% TO {tierInfo.next ? TIER_THRESHOLDS[tierInfo.next].label : 'MAX'}
            </span>
          </div>
        </motion.div>

        {/* ── Quick Stats (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Reward Points</span>
              <p className="font-display text-2xl text-[#eadfed] mt-1">12,450</p>
            </div>
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Tier Multiplier</span>
              <p className="font-display text-2xl text-[#eadfed] mt-1">1.5×</p>
            </div>
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">Pending</span>
              <p className="font-mono text-sm text-white/40 mt-1">0 SP-RR</p>
            </div>
          </div>
        </motion.div>

        {/* ── Tier Progression (12 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-12 bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ddb7ff]">Tier Journey</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">
                {TIER_THRESHOLDS[tier].label}
              </span>
              {tierInfo.next && (
                <>
                  <span className="text-white/15">→</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">
                    {TIER_THRESHOLDS[tierInfo.next].label}
                  </span>
                </>
              )}
            </div>
            <span className="font-mono text-[10px] text-[#ddb7ff]">{Math.round(progress * 100)}%</span>
          </div>

          <div className="w-full h-2 bg-white/[0.06] relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-[#ddb7ff] shadow-[0_0_12px_rgba(221,183,255,0.4)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          <div className="flex justify-between mt-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">Initiate</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">Player</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">Legend</span>
          </div>

          {tierInfo.next ? (
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25 mt-4">
              {formatBalance(Math.max(0, (tierInfo.max ?? 0) - user.sprrBalance))} SP-RR to {TIER_THRESHOLDS[tierInfo.next].label}
            </p>
          ) : (
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff]/[0.6] mt-4">
              Maximum tier achieved
            </p>
          )}
        </motion.div>

        {/* ── Earning Methods (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-3xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">⇉</span>
          <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Referrals</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mb-3">Earn 500 points per referral</p>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff]">Code: {user.referralCode}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-3xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">◆</span>
          <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Purchases</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mb-3">Earn 10 SP-RR per $1 spent</p>
          <Link href="/collections" className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors">
            Browse Drops →
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-3xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">★</span>
          <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Reviews</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mb-3">Submit a review for 100 SP-RR</p>
          <Link href="/profile/rewards" className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors">
            Write Report →
          </Link>
        </motion.div>
      </div>

      {/* ═══ TRANSACTION HISTORY ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
          <h2 className="font-display text-3xl sm:text-4xl uppercase text-[#ddb7ff]">Transaction Log</h2>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">SESSION_ID: 8824-AX-99</span>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <WalletHistoryItem key={tx.id} tx={tx} index={i} />
            ))}
          </div>
        ) : (
          <div className="border border-white/[0.06] p-8 text-center">
            <p className="font-display text-2xl uppercase text-white/15 mb-2">No Transactions</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">
              SP-RR rewards will appear as you engage with drops, orders, and the community.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}

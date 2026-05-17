'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';
import WalletHistoryItem from '@/components/profile/WalletHistoryItem';

function formatBalance(n: number) {
  return n.toLocaleString('en-IN');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const transactions = useAuthStore((s) => s.transactions);
  const progress = useAuthStore(selectTierProgress);

  if (!user) {
    return (
      <div className="py-12">
        <div className="h-4 w-24 bg-white/[0.04] mb-3" />
        <div className="h-10 w-56 bg-white/[0.03]" />
      </div>
    );
  }

  const tier = deriveTier(user.sprrBalance);
  const tierInfo = TIER_THRESHOLDS[tier];
  const recent = transactions.slice(0, 4);
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

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
          [ DATA_STREAM // IDENTITY ]
        </span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#eadfed] leading-none">
            {greeting}, {user.name.split(' ')[0]}.
          </h1>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 whitespace-nowrap">
            MEMBER SINCE {formatDate(user.memberSince).toUpperCase()}
          </span>
        </div>
      </motion.header>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-10">

        {/* ── Main Identity Card (8 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-8 bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 relative overflow-hidden"
        >
          {/* Large tier watermark */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none select-none">
            <span className="font-display text-[120px] text-white leading-none">{tier === 'LEGEND' ? 'L' : tier === 'PLAYER' ? 'P' : 'S'}</span>
          </div>

          <div className="relative z-10">
            {/* Top row: name + tier badge */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-1">Member Profile</span>
                <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-[#eadfed]">{user.name}</h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ddb7ff]">{TIER_THRESHOLDS[tier].label}</span>
              </div>
            </div>

            {/* XP Progression */}
            <div className="mb-6 pb-6 border-b border-white/[0.05]">
              <div className="flex justify-between items-end mb-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
                  {tierInfo.next ? `PROGRESSION TO ${TIER_THRESHOLDS[tierInfo.next].label}` : 'MAXIMUM TIER ACHIEVED'}
                </span>
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
              {tierInfo.next && (
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">Current</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/20">{TIER_THRESHOLDS[tierInfo.next].label}</span>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-1">SP-RR Balance</span>
                <span className="font-display text-2xl text-[#eadfed]">{formatBalance(user.sprrBalance)}</span>
              </div>
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-1">Auth Method</span>
                <span className="font-mono text-[10px] uppercase text-white/50">{user.authProvider === 'google' ? 'Google' : 'Phone'}</span>
              </div>
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-1">Referral Code</span>
                <span className="font-mono text-[10px] uppercase text-[#ddb7ff]/80">{user.referralCode}</span>
              </div>
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 block mb-1">Node</span>
                <span className="font-mono text-[10px] uppercase text-white/50">MUM-01</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Wallet Snapshot (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#ddb7ff] text-[#16111b] p-6 md:p-8 flex flex-col justify-between"
        >
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-60 block mb-2">Universal Wallet</span>
            <h3 className="font-display text-3xl sm:text-4xl uppercase tracking-wide leading-tight">
              $SP_{formatBalance(user.sprrBalance)}
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50 block mt-1">
              {TIER_THRESHOLDS[tier].label} TIER
            </span>
          </div>
          <Link
            href="/profile/wallet"
            className="rounded-none block w-full mt-6 py-3 bg-[#16111b] text-[#ddb7ff] text-center font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-[#231e27] transition-colors"
          >
            Manage Assets →
          </Link>
        </motion.div>

        {/* ── Quick Actions (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 relative group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 block mb-4">Quick Actions</span>
          <div className="space-y-3">
            <Link href="/profile/orders" className="flex items-center justify-between px-3 py-2.5 border border-white/[0.06] hover:border-[#ddb7ff]/30 transition-colors font-mono text-[9px] uppercase tracking-[0.15em] text-white/40 hover:text-[#ddb7ff]/70">
              Acquisition Archive <span>→</span>
            </Link>
            <Link href="/profile/addresses" className="flex items-center justify-between px-3 py-2.5 border border-white/[0.06] hover:border-[#ddb7ff]/30 transition-colors font-mono text-[9px] uppercase tracking-[0.15em] text-white/40 hover:text-[#ddb7ff]/70">
              Delivery Nodes <span>→</span>
            </Link>
            <Link href="/profile/settings" className="flex items-center justify-between px-3 py-2.5 border border-white/[0.06] hover:border-[#ddb7ff]/30 transition-colors font-mono text-[9px] uppercase tracking-[0.15em] text-white/40 hover:text-[#ddb7ff]/70">
              System Preferences <span>→</span>
            </Link>
          </div>
        </motion.div>

        {/* ── Earning Methods (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 text-center group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-3xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">✦</span>
          <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Earn Rewards</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mb-4">Refer friends and earn 500 points each</p>
          <Link href="/profile/rewards" className="inline-block font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors">
            View Campaigns →
          </Link>
        </motion.div>

        {/* ── Activity Stats (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 text-center group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-3xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">◆</span>
          <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Recent Orders</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mb-4">Track your latest acquisitions</p>
          <Link href="/profile/orders" className="inline-block font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors">
            View Archive →
          </Link>
        </motion.div>
      </div>

      {/* ═══ ACTIVITY LOGS ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
          <h2 className="font-display text-3xl sm:text-4xl uppercase text-[#ddb7ff]">Activity Logs</h2>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">SESSION_ID: STR-24-AX</span>
        </div>

        {recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map((tx, i) => (
              <WalletHistoryItem key={tx.id} tx={tx} index={i} />
            ))}
          </div>
        ) : (
          <div className="border border-white/[0.06] p-8 text-center">
            <p className="font-display text-2xl uppercase text-white/15 mb-2">No Activity Yet</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">
              Transactions will appear here as you earn and spend.
            </p>
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-4 text-right">
            <Link
              href="/profile/wallet"
              className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
            >
              View All Transactions →
            </Link>
          </div>
        )}
      </motion.section>
    </div>
  );
}

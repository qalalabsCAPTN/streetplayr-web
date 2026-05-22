'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';

function formatBalance(n: number) {
  return n.toLocaleString('en-IN');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
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

        {/* ── IDENTITY (8 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-8 bg-[#1f1a23] border border-white/[0.06] p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none select-none">
            <span className="font-display text-[120px] text-white leading-none">{tier === 'LEGEND' ? 'L' : tier === 'PLAYER' ? 'P' : 'S'}</span>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 block mb-1">Member Profile</span>
                <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-[#eadfed]">{user.name}</h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ddb7ff]">{TIER_THRESHOLDS[tier].label}</span>
              </div>
            </div>

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

        {/* ── WALLET (4 cols) ── */}
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

        {/* ── YOUR ORDERS (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <span className="font-mono text-2xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">◆</span>
              <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Your Orders</h3>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Track your latest acquisitions</p>
            </div>
            <Link
              href="/profile/orders"
              className="inline-block mt-6 font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors"
            >
              View Archive →
            </Link>
          </div>
        </motion.div>

        {/* ── ADDRESSES (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <span className="font-mono text-2xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">⊞</span>
              <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Addresses</h3>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Manage your delivery nodes</p>
            </div>
            <Link
              href="/profile/addresses"
              className="inline-block mt-6 font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors"
            >
              Manage Nodes →
            </Link>
          </div>
        </motion.div>

        {/* ── EARN REWARDS (4 cols) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 bg-[#231e27] border border-white/[0.06] p-6 text-center group hover:border-[#ddb7ff]/30 transition-colors"
        >
          <span className="font-mono text-3xl text-[#ddb7ff] block mb-3 group-hover:scale-110 transition-transform">✦</span>
          <h3 className="font-display text-xl uppercase text-[#eadfed] mb-2">Earn Rewards</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 mb-4">Refer friends and earn 500 points each</p>
          <Link href="/profile/rewards" className="inline-block font-mono text-[9px] uppercase tracking-[0.15em] text-[#ddb7ff] border-b border-[#ddb7ff]/40 pb-0.5 hover:text-white hover:border-white transition-colors">
            View Campaigns →
          </Link>
        </motion.div>
      </div>

      {/* ═══ YOUR STREETS ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
          <h2 className="font-display text-3xl sm:text-4xl uppercase text-[#ddb7ff]">Your Streets</h2>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">COMMUNITY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/leaderboards"
            className="bg-[#1f1a23] border border-white/[0.06] p-6 hover:border-[#ddb7ff]/30 transition-colors group"
          >
            <span className="font-mono text-lg text-[#ddb7ff] block mb-2 group-hover:scale-110 transition-transform">≡</span>
            <h3 className="font-display text-lg uppercase text-[#eadfed] mb-1">Leaderboards</h3>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">Compete for the top</p>
          </Link>
          <Link
            href="/dashboard/drops"
            className="bg-[#1f1a23] border border-white/[0.06] p-6 hover:border-[#ddb7ff]/30 transition-colors group"
          >
            <span className="font-mono text-lg text-[#ddb7ff] block mb-2 group-hover:scale-110 transition-transform">⊕</span>
            <h3 className="font-display text-lg uppercase text-[#eadfed] mb-1">Drops</h3>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">Upcoming releases</p>
          </Link>
          <Link
            href="/dashboard/referrals"
            className="bg-[#1f1a23] border border-white/[0.06] p-6 hover:border-[#ddb7ff]/30 transition-colors group"
          >
            <span className="font-mono text-lg text-[#ddb7ff] block mb-2 group-hover:scale-110 transition-transform">↗</span>
            <h3 className="font-display text-lg uppercase text-[#eadfed] mb-1">Referrals</h3>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">Invite your crew</p>
          </Link>
          <Link
            href="/dashboard/quests"
            className="bg-[#1f1a23] border border-white/[0.06] p-6 hover:border-[#ddb7ff]/30 transition-colors group"
          >
            <span className="font-mono text-lg text-[#ddb7ff] block mb-2 group-hover:scale-110 transition-transform">◉</span>
            <h3 className="font-display text-lg uppercase text-[#eadfed] mb-1">Quests</h3>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/25">Complete missions</p>
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

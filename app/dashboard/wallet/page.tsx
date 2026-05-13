'use client';

import { motion } from 'framer-motion';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';
import WalletHistoryItem from '@/components/profile/WalletHistoryItem';

function formatBalance(n: number) { return n.toLocaleString('en-IN'); }

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const transactions = useAuthStore((s) => s.transactions);
  const progress = useAuthStore(selectTierProgress);

  if (!user) return null;
  const tier = deriveTier(user.sprrBalance);
  const tierInfo = TIER_THRESHOLDS[tier];

  return (
    <div className="dash-page">
      <section className="dash-hero-sm"><p className="dash-hero-eyebrow">SP-RR Wallet</p><h1 className="dash-hero-title">{formatBalance(user.sprrBalance)} <span className="dash-hero-unit">SP·RR</span></h1></section>
      <motion.section className="dash-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="dash-panel-row">
          <div><div className="dash-panel-title text-sm">{TIER_THRESHOLDS[tier].label} Tier</div>
            <div className="dash-panel-desc">{tierInfo.next ? `${formatBalance(Math.max(0, (tierInfo.max ?? 0) - user.sprrBalance))} SP-RR to ${TIER_THRESHOLDS[tierInfo.next].label}` : 'Maximum tier achieved'}</div>
          </div>
          <div className="w-48"><div className="dash-card-track"><motion.div className="dash-card-fill" initial={{ scaleX: 0 }} animate={{ scaleX: progress }} transition={{ delay: 0.3, duration: 1 }} style={{ transformOrigin: 'left', background: `var(--tier-${tier.toLowerCase()})` }} /></div></div>
        </div>
      </motion.section>
      <section className="dash-section"><h2 className="dash-section-title">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="dash-empty"><p className="dash-empty-title">Your story starts here</p><p className="dash-empty-sub">SP-RR rewards will appear as you engage with drops and the community.</p></div>
        ) : (
          <div className="dash-timeline">{transactions.map((tx, i) => (<WalletHistoryItem key={tx.id} tx={tx} index={i} />))}</div>
        )}
      </section>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';
import TierBadge from '@/components/auth/TierBadge';
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
    <div className="profile-page-root">
      {/* ── Atmospheric Balance Display ───────────────────────────────── */}
      <section className="wallet-hero" aria-label="SP-RR Balance">
        <motion.div
          className="wallet-hero-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <p className="wallet-eyebrow">SP-RR Balance</p>

          <motion.div
            className="wallet-balance-display"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="wallet-balance-number">{formatBalance(user.sprrBalance)}</span>
            <span className="wallet-balance-unit">SP·RR</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <TierBadge balance={user.sprrBalance} size="md" />
          </motion.div>
        </motion.div>

        {/* Atmospheric gradient orb */}
        <div className="wallet-atmosphere-orb" aria-hidden="true" />
      </section>

      {/* ── Tier Journey ─────────────────────────────────────────────── */}
      <motion.section
        className="wallet-tier-section"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        aria-label="Tier journey"
      >
        <div className="wallet-tier-header">
          <span className="wallet-tier-current">
            {TIER_THRESHOLDS[tier].label} Tier
          </span>
          {tierInfo.next && (
            <span className="wallet-tier-next">
              → {TIER_THRESHOLDS[tierInfo.next].label}
            </span>
          )}
        </div>

        <div className="wallet-tier-track" aria-label={`Tier progress: ${Math.round(progress * 100)}%`}>
          <motion.div
            className="wallet-tier-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ delay: 0.7, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin: 'left',
              background: `var(--tier-${tier.toLowerCase()})`,
            }}
            data-tier={tier}
          />
        </div>

        {tierInfo.next ? (
          <p className="wallet-tier-hint">
            {formatBalance(Math.max(0, (tierInfo.max ?? 0) - user.sprrBalance))} SP-RR to{' '}
            <span style={{ color: `var(--tier-${tierInfo.next.toLowerCase()})` }}>
              {TIER_THRESHOLDS[tierInfo.next].label}
            </span>
          </p>
        ) : (
          <p className="wallet-tier-hint" style={{ color: 'var(--tier-legend)' }}>
            ✦ You&apos;ve reached the apex
          </p>
        )}
      </motion.section>

      {/* ── Transaction History ───────────────────────────────────────── */}
      <section className="wallet-history-section" aria-label="Transaction history">
        <h2 className="wallet-history-title">History</h2>

        {transactions.length === 0 ? (
          <motion.div
            className="wallet-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="wallet-empty-text">Your story starts here.</p>
            <p className="wallet-empty-sub">SP-RR rewards will appear as you engage with drops, orders, and the community.</p>
          </motion.div>
        ) : (
          <div className="wallet-tx-list">
            {transactions.map((tx, i) => (
              <WalletHistoryItem key={tx.id} tx={tx} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

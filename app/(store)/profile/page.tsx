'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';
import MembershipCard from '@/components/auth/MembershipCard';
import WalletHistoryItem from '@/components/profile/WalletHistoryItem';

function formatBalance(n: number) {
  return n.toLocaleString('en-IN');
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const transactions = useAuthStore((s) => s.transactions);
  const progress = useAuthStore(selectTierProgress);

  if (!user) {
    return (
      <div className="profile-page-root">
        <div className="profile-identity-hero" style={{ padding: '2rem 0', opacity: 0.3 }}>
          <div className="profile-greeting-sub" style={{ height: '0.8rem', width: '6rem', background: 'rgba(255,255,255,0.06)', marginBottom: '0.6rem' }} />
          <div style={{ height: '2.5rem', width: '14rem', background: 'rgba(255,255,255,0.04)' }} />
        </div>
      </div>
    );
  }

  const tier = deriveTier(user.sprrBalance);
  const tierInfo = TIER_THRESHOLDS[tier];
  const recent = transactions.slice(0, 3);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="profile-page-root">
      {/* ── Hero greeting ────────────────────────────────────────────── */}
      <section className="profile-identity-hero" aria-label="Member identity">
        <motion.div
          className="profile-greeting"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="profile-greeting-sub">{greeting}</p>
          <h1 className="profile-greeting-name">{user.name}.</h1>
        </motion.div>

        {/* Membership Card */}
        <MembershipCard user={user} />

        {/* Tier progress */}
        <motion.div
          className="profile-tier-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {tierInfo.next ? (
            <p className="profile-tier-hint">
              <span style={{ color: 'var(--sp-accent)', fontVariantNumeric: 'tabular-nums' }}>
                {formatBalance(Math.max(0, (tierInfo.max ?? 0) - user.sprrBalance))} SP-RR
              </span>
              {' '}until {TIER_THRESHOLDS[tierInfo.next].label} tier
            </p>
          ) : (
            <p className="profile-tier-hint" style={{ color: 'var(--tier-legend)' }}>
              ✦ Maximum tier achieved
            </p>
          )}
          <div className="profile-tier-bar-track" aria-hidden="true">
            <motion.div
              className="profile-tier-bar-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left', background: `var(--tier-${tier.toLowerCase()})` }}
            />
          </div>
        </motion.div>
      </section>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <section className="profile-quick-actions" aria-label="Quick navigation">
        {[
          { label: 'Wallet', href: '/profile/wallet', sub: `${formatBalance(user.sprrBalance)} SP-RR` },
          { label: 'Orders', href: '/profile/orders', sub: 'Your acquisitions' },
          { label: 'Settings', href: '/profile/settings', sub: 'Preferences' },
        ].map((item, i) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
          >
            <Link href={item.href} className="profile-quick-action-card" id={`quick-${item.label.toLowerCase()}`}>
              <span className="profile-quick-action-label">{item.label}</span>
              <span className="profile-quick-action-sub">{item.sub}</span>
              <span className="profile-quick-action-arrow">→</span>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* ── Recent Wallet Activity ────────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="profile-recent-section" aria-label="Recent wallet activity">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Recent Activity</h2>
            <Link href="/profile/wallet" className="profile-section-link">View all</Link>
          </div>
          <div className="profile-recent-list">
            {recent.map((tx, i) => (
              <WalletHistoryItem key={tx.id} tx={tx} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Member ID ─────────────────────────────────────────────────── */}
      <motion.section
        className="profile-member-id-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        aria-label="Member ID"
      >
        <p className="profile-member-id-label">Referral Code</p>
        <p className="profile-member-id-value" id="referral-code-display">{user.referralCode}</p>
      </motion.section>
    </div>
  );
}

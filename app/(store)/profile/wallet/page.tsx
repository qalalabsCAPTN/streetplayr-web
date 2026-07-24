'use client';

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
    <div>
      <div className="acct-hero">
        <p className="acct-hero__greet">Assets</p>
        <h1 className="acct-hero__name">Wallet</h1>
      </div>

      <div className="acct-grid">
        <div className="acct-card acct-card--wide">
          <span className="acct-card__eyebrow">SP-RR Balance</span>
          <h2 className="acct-balance">{formatBalance(user.sprrBalance)} <small>SP-RR</small></h2>
          <span className="acct-card__sub">
            {tierInfo.label} tier · {Math.round(progress * 100)}% to {tierInfo.next ? TIER_THRESHOLDS[tierInfo.next].label : 'max'}
          </span>
        </div>

        <div className="acct-card">
          <div className="acct-card__stats acct-card__stats--stack">
            <div>
              <span>Reward points</span>
              <strong>12,450</strong>
            </div>
            <div>
              <span>Tier multiplier</span>
              <strong>1.5×</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>0 SP-RR</strong>
            </div>
          </div>
        </div>

        <div className="acct-card acct-card--wide">
          <div className="acct-progress__head">
            <span>Tier journey — {tierInfo.label}{tierInfo.next ? ` → ${TIER_THRESHOLDS[tierInfo.next].label}` : ''}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="acct-progress__track">
            <div className="acct-progress__fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="acct-card__sub" style={{ marginTop: 12 }}>
            {tierInfo.next
              ? `${formatBalance(Math.max(0, (tierInfo.max ?? 0) - user.sprrBalance))} SP-RR to ${TIER_THRESHOLDS[tierInfo.next].label}`
              : 'Maximum tier achieved'}
          </p>
        </div>

        <div className="acct-card acct-card--link">
          <h3>Referrals</h3>
          <p>Earn 500 points per referral</p>
          <span>Code: {user.referralCode}</span>
        </div>

        <Link href="/collections" className="acct-card acct-card--link">
          <h3>Purchases</h3>
          <p>Earn 10 SP-RR per Rs. 1 spent</p>
          <span>Browse drops →</span>
        </Link>

        <Link href="/profile/rewards" className="acct-card acct-card--link">
          <h3>Reviews</h3>
          <p>Submit a review for 100 SP-RR</p>
          <span>Write review →</span>
        </Link>
      </div>

      <div className="acct-section-head">
        <h2>Transaction Log</h2>
      </div>

      {transactions.length > 0 ? (
        <div className="acct-txlog">
          {transactions.map((tx) => (
            <WalletHistoryItem key={tx.id} tx={tx} />
          ))}
        </div>
      ) : (
        <div className="acct-empty" style={{ margin: 0 }}>
          <p className="acct-empty__title">No transactions yet</p>
          <p className="acct-empty__sub">SP-RR rewards will appear as you engage with drops, orders, and the community.</p>
        </div>
      )}
    </div>
  );
}

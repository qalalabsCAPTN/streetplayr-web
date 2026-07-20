'use client';

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

  if (!user) return null;

  const tier = deriveTier(user.sprrBalance);
  const tierInfo = TIER_THRESHOLDS[tier];
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="acct-hero">
        <h1>{greeting}, {user.name.split(' ')[0]}.</h1>
        <span>Member since {formatDate(user.memberSince)}</span>
      </div>

      <div className="acct-grid">
        <div className="acct-card acct-card--wide">
          <div className="acct-card__head">
            <div>
              <span className="acct-card__eyebrow">Member profile</span>
              <h2>{user.name}</h2>
            </div>
            <span className="acct-card__tier">{tierInfo.label}</span>
          </div>

          <div className="acct-progress">
            <div className="acct-progress__head">
              <span>{tierInfo.next ? `Progress to ${TIER_THRESHOLDS[tierInfo.next].label}` : 'Maximum tier reached'}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="acct-progress__track">
              <div className="acct-progress__fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>

          <div className="acct-card__stats">
            <div>
              <span>SP-RR Balance</span>
              <strong>{formatBalance(user.sprrBalance)}</strong>
            </div>
            <div>
              <span>Auth method</span>
              <strong>{user.authProvider === 'google' ? 'Google' : 'Phone'}</strong>
            </div>
            <div>
              <span>Referral code</span>
              <strong>{user.referralCode}</strong>
            </div>
          </div>
        </div>

        <div className="acct-card acct-card--accent">
          <span className="acct-card__eyebrow">Universal wallet</span>
          <h3>Rs. {formatBalance(user.sprrBalance)}</h3>
          <span className="acct-card__sub">{tierInfo.label} tier</span>
          <Link href="/profile/wallet" className="pill">Manage assets →</Link>
        </div>

        <Link href="/profile/orders" className="acct-card acct-card--link">
          <h3>Your orders</h3>
          <p>Track your latest acquisitions</p>
          <span>View archive →</span>
        </Link>

        <Link href="/profile/addresses" className="acct-card acct-card--link">
          <h3>Saved addresses</h3>
          <p>Manage your delivery addresses</p>
          <span>Manage addresses →</span>
        </Link>

        <Link href="/profile/rewards" className="acct-card acct-card--link">
          <h3>Earn rewards</h3>
          <p>Refer friends and earn 500 points each</p>
          <span>View campaigns →</span>
        </Link>
      </div>

      <div className="acct-section-head">
        <h2>Your Streets</h2>
      </div>
      <div className="acct-grid acct-grid--4">
        <Link href="/dashboard/leaderboards" className="acct-card acct-card--link">
          <h3>Leaderboards</h3>
          <p>Compete for the top</p>
        </Link>
        <Link href="/dashboard/drops" className="acct-card acct-card--link">
          <h3>Drops</h3>
          <p>Upcoming releases</p>
        </Link>
        <Link href="/dashboard/referrals" className="acct-card acct-card--link">
          <h3>Referrals</h3>
          <p>Invite your crew</p>
        </Link>
        <Link href="/dashboard/quests" className="acct-card acct-card--link">
          <h3>Quests</h3>
          <p>Complete missions</p>
        </Link>
      </div>
    </div>
  );
}

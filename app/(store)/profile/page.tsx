'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';
import { useTryOnSaveStore } from '@/store/tryonSaveStore';
import TryOnGallery from '@/components/profile/TryOnGallery';

function formatBalance(n: number) {
  return n.toLocaleString('en-IN');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
}

function RecentTryOnsSection() {
  const items = useTryOnSaveStore((s) => s.items);
  const hydrated = useTryOnSaveStore((s) => s.hydrated);
  const hydrate = useTryOnSaveStore((s) => s.hydrate);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void hydrate();
  }, [hydrate]);

  if (!mounted || !hydrated || items.length === 0) return null;

  return (
    <>
      <div className="acct-section-head">
        <div className="acct-section-head__row">
          <h2>Recent try-ons</h2>
          <Link href="/profile/try-ons" className="acct-section-head__link">
            All →
          </Link>
        </div>
      </div>
      <TryOnGallery compact limit={4} />
    </>
  );
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
        <div className="acct-hero__row">
          <div className="acct-hero__avatar" aria-hidden="true">
            {user.name.split(' ')[0].charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="acct-hero__greet">{greeting},</p>
            <h1 className="acct-hero__name">{user.name.split(' ')[0]}</h1>
            <span className="acct-hero__meta">Member since {formatDate(user.memberSince)}</span>
          </div>
        </div>
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
          <Link href="/profile/wallet" className="storefront-cta storefront-cta--inline">Manage assets →</Link>
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

        <Link href="/profile/try-ons" className="acct-card acct-card--link">
          <h3>AI Try-Ons</h3>
          <p>Saved looks across every garment you tried</p>
          <span>Open gallery →</span>
        </Link>
      </div>

      <RecentTryOnsSection />

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

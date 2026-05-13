'use client';

import { motion } from 'framer-motion';
import { useAuthStore, deriveTier, TIER_THRESHOLDS, selectTierProgress } from '@/store/authStore';

function formatBalance(n: number) { return n.toLocaleString('en-IN'); }

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const progress = useAuthStore(selectTierProgress);

  if (!user) return null;

  const tier = deriveTier(user.sprrBalance);
  const tierInfo = TIER_THRESHOLDS[tier];

  return (
    <div className="dash-page">
      <section className="dash-hero">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="dash-hero-eyebrow">NECTAR Dashboard</p>
          <h1 className="dash-hero-title">{user.name || 'Member'}</h1>
          <p className="dash-hero-sub">{tierInfo.label} Tier · {formatBalance(user.sprrBalance)} SP-RR</p>
        </motion.div>
      </section>

      <section className="dash-cards">
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="dash-card-label">SP-RR Balance</div>
          <div className="dash-card-value">{formatBalance(user.sprrBalance)}</div>
          <div className="dash-card-unit">Loyalty Points</div>
          {tierInfo.next && (
            <div className="dash-card-progress">
              <div className="dash-card-track">
                <motion.div className="dash-card-fill" initial={{ scaleX: 0 }} animate={{ scaleX: progress }} transition={{ delay: 0.5, duration: 1 }} style={{ transformOrigin: 'left' }} />
              </div>
              <span className="dash-card-progress-label">{Math.round(progress * 100)}% to {TIER_THRESHOLDS[tierInfo.next].label}</span>
            </div>
          )}
        </motion.div>

        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="dash-card-label">Current Tier</div>
          <div className="dash-card-value" style={{ color: `var(--tier-${tier.toLowerCase()})` }}>{tierInfo.label}</div>
          <div className="dash-card-unit">x{(tier === 'LEGEND' ? 1.5 : tier === 'PLAYER' ? 1.25 : 1).toFixed(2)} Reward Multiplier</div>
        </motion.div>

        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="dash-card-label">Member Since</div>
          <div className="dash-card-value">{user.memberSince ? new Date(user.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</div>
          <div className="dash-card-unit">{user.email || 'No email'}</div>
        </motion.div>
      </section>

      <section className="dash-grid-cols-2">
        <div className="dash-panel">
          <h2 className="dash-panel-title">Quick Links</h2>
          <div className="dash-link-list">
            {[
              { label: 'Rewards & Tiers', href: '/dashboard/rewards', desc: 'View your progression and active campaigns' },
              { label: 'Referral Program', href: '/dashboard/referrals', desc: 'Invite friends and earn SP-RR' },
              { label: 'Wallet History', href: '/dashboard/wallet', desc: 'Transaction log and SP-RR activity' },
              { label: 'Order History', href: '/dashboard/orders', desc: 'Your acquisitions and drops' },
            ].map((item) => (
              <a key={item.href} href={item.href} className="dash-link-item">
                <div>
                  <div className="dash-link-label">{item.label}</div>
                  <div className="dash-link-desc">{item.desc}</div>
                </div>
                <span className="dash-link-arrow">→</span>
              </a>
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <h2 className="dash-panel-title">Tier Benefits</h2>
          <div className="dash-benefits">
            {[
              { tier: 'STREET', benefit: 'Base rewards · 1.0x multiplier' },
              { tier: 'PLAYER', benefit: '25% bonus · Early access to drops' },
              { tier: 'LEGEND', benefit: '50% bonus · Exclusive events · Priority' },
            ].map((b) => (
              <div key={b.tier} className={`dash-benefit-row ${tier === b.tier ? 'dash-benefit-row--active' : ''}`}>
                <span className="dash-benefit-tier">{b.tier}</span>
                <span className="dash-benefit-desc">{b.benefit}</span>
                {tier === b.tier && <span className="dash-benefit-current">Current</span>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

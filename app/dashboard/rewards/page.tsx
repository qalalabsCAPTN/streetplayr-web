'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, deriveTier, TIER_THRESHOLDS } from '@/store/authStore';

function formatNumber(n: number) { return n.toLocaleString('en-IN'); }

interface Campaign { id: string; name: string; description: string | null; sprr_reward: number; xp_reward: number; is_active: boolean; }
interface Redemption { id: string; description: string; sprr_cost: number; status: string; redeemed_at: string | null; created_at: string; }

export default function RewardsPage() {
  const user = useAuthStore((s) => s.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/nectar/rewards');
        if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns ?? []); setRedemptions(d.redemptions ?? []); }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (!user) return null;
  const sprr = user.sprrBalance;
  const tier = deriveTier(sprr);
  const threshold = TIER_THRESHOLDS[tier];
  const nextTier = threshold.next;
  const progress = threshold.max ? Math.min(1, (sprr - threshold.min) / (threshold.max - threshold.min)) : 1;

  return (
    <div className="dash-page">
      <section className="dash-hero-sm">
        <p className="dash-hero-eyebrow">NECTAR Rewards</p>
        <h1 className="dash-hero-title">Loyalty Progression</h1>
      </section>
      <section className="dash-cards-three">
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="dash-card-label">Current Tier</div>
          <div className="dash-card-value" style={{ color: `var(--tier-${tier.toLowerCase()})` }}>{threshold.label}</div>
          <div className="dash-card-unit">x{(tier === 'LEGEND' ? 1.5 : tier === 'PLAYER' ? 1.25 : 1).toFixed(2)} multiplier</div>
          {nextTier && (
            <div className="dash-card-progress">
              <div className="dash-card-track"><motion.div className="dash-card-fill" initial={{ scaleX: 0 }} animate={{ scaleX: progress }} transition={{ delay: 0.3, duration: 1 }} style={{ transformOrigin: 'left', background: `var(--tier-${tier.toLowerCase()})` }} /></div>
              <span className="dash-card-progress-label">{formatNumber(sprr - threshold.min)} / {formatNumber(threshold.max! - threshold.min)} to {TIER_THRESHOLDS[nextTier].label}</span>
            </div>
          )}
        </motion.div>
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="dash-card-label">SP-RR Balance</div>
          <div className="dash-card-value">{formatNumber(sprr)}</div>
          <div className="dash-card-unit">Spendable loyalty points</div>
        </motion.div>
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="dash-card-label">Tier Progress</div>
          <div className="dash-card-value">{Math.round(progress * 100)}%</div>
          <div className="dash-card-unit">{nextTier ? `${formatNumber(Math.max(0, (threshold.max ?? 0) - sprr))} SP-RR to ${TIER_THRESHOLDS[nextTier].label}` : 'Maximum tier achieved'}</div>
        </motion.div>
      </section>
      {campaigns.length > 0 && (
        <section className="dash-section"><h2 className="dash-section-title">Active Bonus Campaigns</h2>
          <div className="dash-grid-cols-2">{campaigns.map((c) => (
            <div key={c.id} className="dash-panel"><h3 className="dash-panel-title text-sm">{c.name}</h3>
              {c.description && <p className="dash-panel-desc">{c.description}</p>}
              <div className="dash-badge-row mt-2">
                {c.sprr_reward > 0 && <span className="dash-badge dash-badge-accent">+{formatNumber(c.sprr_reward)} SP-RR</span>}
                {c.xp_reward > 0 && <span className="dash-badge dash-badge-blue">+{formatNumber(c.xp_reward)} XP</span>}
              </div>
            </div>
          ))}</div>
        </section>
      )}
      {loading ? <div className="dash-loading-pulse" />
        : redemptions.length > 0 ? (
          <section className="dash-section"><h2 className="dash-section-title">Redemption History</h2>
            <div className="dash-timeline">{redemptions.map((r) => (
              <div key={r.id} className="dash-timeline-item">
                <div className="dash-timeline-left"><div className="dash-timeline-title">{r.description}</div><div className="dash-timeline-sub">{r.status} · {new Date(r.redeemed_at ?? r.created_at).toLocaleDateString()}</div></div>
                <div className="dash-timeline-right">-{formatNumber(r.sprr_cost)} SP</div>
              </div>
            ))}</div>
          </section>
        ) : (
          <section className="dash-section"><div className="dash-empty"><p className="dash-empty-title">No redemptions yet</p><p className="dash-empty-sub">Earn SP-RR through purchases and referrals.</p></div></section>
        )}
    </div>
  );
}

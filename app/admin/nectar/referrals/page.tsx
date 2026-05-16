'use client';

import { TopBar } from '@/components/ops2/top-bar';
import { GitBranch, Users, TrendingUp, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';

const REFERRAL_STATS = {
  totalReferrals: 18420,
  successfulConversions: 14840,
  conversionRate: 80.6,
  totalPointsPaid: 29680000,
  activeAmbassadors: 28,
  avgReferralsPerReferrer: 4.2,
  viralCoefficient: 1.34,
};

const TOP_REFERRERS = [
  { rank: 1, userId: 'usr_priya_ref', displayName: 'Priya S.', referrals: 847, tier: 'apex', pointsEarned: 1694000, badge: '👑' },
  { rank: 2, userId: 'usr_rahul_ref', displayName: 'Rahul M.', referrals: 623, tier: 'apex', pointsEarned: 1246000, badge: '🥈' },
  { rank: 3, userId: 'usr_arjun_ref', displayName: 'Arjun K.', referrals: 441, tier: 'nectar', pointsEarned: 882000, badge: '🥉' },
  { rank: 4, userId: 'usr_neha_ref',  displayName: 'Neha R.',  referrals: 312, tier: 'nectar', pointsEarned: 624000, badge: '' },
  { rank: 5, userId: 'usr_kiran_ref', displayName: 'Kiran V.', referrals: 288, tier: 'bloom',  pointsEarned: 576000, badge: '' },
];

const REFERRAL_FUNNEL = [
  { stage: 'Link Shared',       count: 84200, pct: 100 },
  { stage: 'Link Clicked',      count: 52140, pct: 61.9 },
  { stage: 'Signed Up',         count: 18420, pct: 21.9 },
  { stage: 'Verified',          count: 16840, pct: 20.0 },
  { stage: 'First Purchase',    count: 14840, pct: 17.6 },
  { stage: 'Reward Paid',       count: 14840, pct: 17.6 },
];

const TIER_COLORS: Record<string, string> = {
  apex:   '#FBBF24',
  nectar: '#F97316',
  bloom:  '#60A5FA',
  sprout: '#34D399',
  seed:   '#94A3B8',
};

export default function ReferralsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Referrals" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-nectar-400" />
            </div>
            <div>
              <h2 className="page-title">Referral System</h2>
              <p className="text-sm text-text-muted mt-0.5">Graph, attribution, conversion funnel, ambassadors</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Total Referrals</div>
              <div className="metric-value">{REFERRAL_STATS.totalReferrals.toLocaleString()}</div>
              <div className="metric-subtext">lifetime signups</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Conversion Rate</div>
              <div className="metric-value text-status-success">{REFERRAL_STATS.conversionRate}%</div>
              <div className="metric-subtext">signup → purchase</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Viral Coefficient</div>
              <div className={cn('metric-value', REFERRAL_STATS.viralCoefficient >= 1 ? 'text-status-success' : 'text-status-warning')}>
                K={REFERRAL_STATS.viralCoefficient}
              </div>
              <div className="metric-subtext">≥1.0 = viral growth</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Points Paid</div>
              <div className="metric-value text-nectar-300">29.7M</div>
              <div className="metric-subtext">lifetime referral rewards</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="surface rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-4 w-4 text-nectar-400" />
                <h3 className="text-sm font-semibold text-text-primary">Referral Funnel</h3>
              </div>
              <div className="space-y-3">
                {REFERRAL_FUNNEL.map((stage, i) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-text-secondary">{stage.stage}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-text-muted">{stage.count.toLocaleString()}</span>
                        <span className="font-semibold text-text-primary w-10 text-right">{stage.pct}%</span>
                      </div>
                    </div>
                    <div className="h-6 w-full rounded-lg bg-base-overlay overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-2 transition-all"
                        style={{
                          width: `${stage.pct}%`,
                          backgroundColor: `hsl(${220 + i * 15}, 80%, ${40 + i * 4}%)`,
                        }}
                      >
                        {stage.pct > 15 && (
                          <span className="text-[10px] font-medium text-white">{stage.pct}%</span>
                        )}
                      </div>
                    </div>
                    {i < REFERRAL_FUNNEL.length - 1 && (
                      <div className="flex items-center justify-end mt-1 text-[10px] text-text-muted">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {((REFERRAL_FUNNEL[i + 1].count / stage.count) * 100).toFixed(1)}% pass-through
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="surface rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Crown className="h-4 w-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-text-primary">Top Referrers (All-Time)</h3>
              </div>
              <div className="space-y-3">
                {TOP_REFERRERS.map(r => (
                  <div key={r.userId} className="flex items-center gap-3 p-3 rounded-lg bg-base-elevated">
                    <div className="w-6 text-center text-sm font-bold text-text-muted">
                      {r.badge || `#${r.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{r.displayName}</span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
                          style={{ color: TIER_COLORS[r.tier], backgroundColor: `${TIER_COLORS[r.tier]}20` }}
                        >
                          {r.tier}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{r.referrals.toLocaleString()} referrals</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-nectar-300">
                        +{(r.pointsEarned / 1000).toFixed(0)}k pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  {REFERRAL_STATS.activeAmbassadors} active ambassadors
                </div>
                <div>avg {REFERRAL_STATS.avgReferralsPerReferrer} referrals/referrer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { KpiGrid } from '@/modules/overview/components/kpi-grid';
import { PlatformBreakdown } from '@/modules/overview/components/platform-breakdown';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveTier } from '@/lib/nectar/engine';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

async function getTierDistribution() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('sprr_balance')
    .not('sprr_balance', 'is', null);

  const counts: Record<string, number> = { LEGEND: 0, PLAYER: 0, STREET: 0 };
  for (const p of data ?? []) {
    const tier = deriveTier(p.sprr_balance ?? 0);
    counts[tier] = (counts[tier] ?? 0) + 1;
  }

  return [
    { tier: 'Legend', count: counts.LEGEND, color: '#C026D3' },
    { tier: 'Playr',  count: counts.PLAYER, color: '#F5A800' },
    { tier: 'Street', count: counts.STREET, color: '#34D399' },
  ];
}

export default async function AnalyticsPage() {
  const tiers = await getTierDistribution();
  const total = tiers.reduce((s, t) => s + t.count, 0);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Analytics" />
      <div className="flex-1 pt-14 p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Ecosystem performance, platform attribution, and behavioral intelligence
            </p>
          </div>
        </div>

        <KpiGrid period="30d" />

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2"><PlatformBreakdown /></div>
          <div className="surface p-5 space-y-4">
            <div className="section-title">Tier Distribution</div>
            <div className="text-xs text-text-muted mb-2">{total.toLocaleString()} total users · live data</div>
            {tiers.map(t => (
              <div key={t.tier} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-sm text-text-secondary flex-1">{t.tier}</span>
                <span className="text-sm font-medium text-text-primary">{t.count.toLocaleString()}</span>
                {total > 0 && (
                  <span className="text-xs text-text-muted w-10 text-right">
                    {((t.count / total) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
            {total === 0 && (
              <p className="text-xs text-text-muted opacity-60">No users yet</p>
            )}
          </div>
        </div>

        <div className="surface p-5">
          <div className="section-title mb-4">Analytics Pipeline</div>
          <p className="text-sm text-text-muted">
            Advanced analytics with ClickHouse pipeline, cohort analysis, and attribution modeling
            are part of the roadmap. Current metrics aggregate from Postgres views.
          </p>
        </div>
      </div>
    </div>
  );
}

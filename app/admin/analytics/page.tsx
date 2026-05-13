import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { KpiGrid } from '@/modules/overview/components/kpi-grid';
import { PlatformBreakdown } from '@/modules/overview/components/platform-breakdown';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Analytics" />
      <div className="flex-1 pt-14 p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="text-sm text-text-muted mt-0.5">Ecosystem performance, platform attribution, and behavioral intelligence</p>
          </div>
        </div>

        <KpiGrid period="30d" />

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2"><PlatformBreakdown /></div>
          <div className="surface p-5 space-y-4">
            <div className="section-title">Tier Distribution</div>
            {[
              { tier: 'Apex',   count: 180,   color: '#C026D3' },
              { tier: 'Nectar', count: 580,   color: '#F5A800' },
              { tier: 'Bloom',  count: 1120,  color: '#60A5FA' },
              { tier: 'Sprout', count: 2840,  color: '#34D399' },
              { tier: 'Seed',   count: 8420,  color: '#9CA3AF' },
            ].map(t => (
              <div key={t.tier} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-sm text-text-secondary flex-1">{t.tier}</span>
                <span className="text-sm font-medium text-text-primary">{t.count.toLocaleString()}</span>
              </div>
            ))}
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

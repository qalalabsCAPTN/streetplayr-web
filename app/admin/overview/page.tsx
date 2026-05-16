import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { KpiGrid } from '@/modules/overview/components/kpi-grid';
import { LiveEventFeed } from '@/modules/overview/components/live-event-feed';
import { PlatformBreakdown } from '@/modules/overview/components/platform-breakdown';

export const metadata: Metadata = { title: 'Overview' };

export default function OverviewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Ecosystem Overview" />

      <div className="flex-1 pt-14 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Ecosystem Overview</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Cross-platform behavioral intelligence — all PlayR ecosystem data
            </p>
          </div>

          <div className="flex items-center gap-1 bg-base-elevated border border-border rounded-lg p-1">
            {(['1d', '7d', '30d'] as const).map((period) => (
              <button
                key={period}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-text-muted hover:text-text-primary hover:bg-base-overlay transition-all duration-150 first:text-text-primary first:bg-base-overlay"
              >
                {period === '1d' ? '24h' : period === '7d' ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
        </div>

        <KpiGrid period="7d" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LiveEventFeed />
          </div>
          <div className="lg:col-span-1">
            <PlatformBreakdown />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { tier: 'Seed',   count: 8420,  pct: 62, color: '#9CA3AF' },
            { tier: 'Sprout', count: 2840,  pct: 21, color: '#34D399' },
            { tier: 'Bloom',  count: 1120,  pct: 8,  color: '#60A5FA' },
            { tier: 'Nectar', count: 580,   pct: 4,  color: '#F5A800' },
            { tier: 'Apex',   count: 180,   pct: 1.3,color: '#C026D3' },
          ].map(t => (
            <div key={t.tier} className="surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: t.color }}>{t.tier}</span>
                <span className="text-xs text-text-muted">{t.pct}%</span>
              </div>
              <span className="text-2xl font-bold text-text-primary">
                {t.count.toLocaleString()}
              </span>
              <div className="h-1 rounded-full bg-base-overlay overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${t.pct}%`, backgroundColor: t.color, opacity: 0.7 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

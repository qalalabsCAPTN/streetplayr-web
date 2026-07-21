'use client';

import { cn } from '@/lib/ops2/cn';
import { PLATFORMS } from '@/types/ops2/ops';
import { formatNumber } from '@/lib/ops2/format';

const MOCK_BREAKDOWN = [
  { id: 'streetplayr', gmv: 284500, users: 12400, events: 48200 },
  { id: 'playr',       gmv: 0,      users: 8200,  events: 62100 },
  { id: 'playr-club',  gmv: 45200,  users: 3100,  events: 15400 },
  { id: 'playr-game',  gmv: 0,      users: 19800, events: 94600 },
];

const PLATFORM_DOT_COLORS: Record<string, string> = {
  streetplayr: 'bg-platform-streetplayr',
  playr:       'bg-platform-playr',
  'playr-club':'bg-platform-club',
  'playr-game':'bg-platform-game',
};

export function PlatformBreakdown() {
  const total = MOCK_BREAKDOWN.reduce((s, p) => s + p.events, 0);

  return (
    <div className="surface p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="section-title">Platform Activity</span>
        <span className="text-xs text-text-muted">Last 7 days</span>
      </div>

      <div className="space-y-3">
        {MOCK_BREAKDOWN.map(platform => {
          const meta = PLATFORMS.find(p => p.id === platform.id);
          if (!meta) return null;
          const pct = Math.round((platform.events / total) * 100);

          return (
            <div key={platform.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full shrink-0', PLATFORM_DOT_COLORS[platform.id])} />
                  <span className="text-sm font-medium text-text-primary">{meta.label}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span>{formatNumber(platform.users)} users</span>
                  <span className="font-medium text-text-secondary">{formatNumber(platform.events)} events</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-base-overlay overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: meta.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { TIERS } from '@nectar/types';
import { TierBadge } from '@/components/ops2/ui/badge';
export const metadata: Metadata = { title: 'Tiers' };
export default function TiersPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Tiers" />
      <div className="flex-1 pt-14 p-5 space-y-5">
        <h2 className="page-title">Tier System</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.values(TIERS).map((t) => (
            <div key={t.id} className="surface p-5 flex flex-col gap-3">
              <TierBadge tier={t.id} />
              <div className="text-2xl font-bold text-text-primary">{t.multiplier}x</div>
              <div className="text-xs text-text-muted">{t.xpThreshold.toLocaleString()} XP threshold</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

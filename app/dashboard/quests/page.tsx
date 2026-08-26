'use client';

import { useEffect, useState } from 'react';
import { Scroll, Zap } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import type { LoyaltyQuestView } from '@/app/actions/loyalty';

const STATUS_CONFIG = {
  active:    { label: 'Active',     color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  completed: { label: 'Complete',   color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  available: { label: 'Available',  color: '#94A3B8', bg: 'rgba(148,163,184,0.06)' },
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<LoyaltyQuestView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { getLoyaltySnapshotAction } = await import('@/app/actions/loyalty');
      const result = await getLoyaltySnapshotAction();
      if (result.success) setQuests(result.data.quests);
      setLoaded(true);
    })();
  }, []);

  const active = quests.filter((q) => q.status === 'active');
  const completed = quests.filter((q) => q.status === 'completed');
  const available = quests.filter((q) => q.status === 'available');

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3 animate-fade-up">
        <Scroll className="h-8 w-8 text-nectar-400" />
        <div>
          <h1 className="text-3xl font-black text-text-primary">Quests</h1>
          <p className="text-sm text-text-muted">
            {loaded
              ? `${active.length} active · ${completed.length} completed · ${available.length} available`
              : 'Loading live quests…'}
          </p>
        </div>
      </div>

      {loaded && quests.length === 0 && (
        <div className="card p-8 text-sm text-text-muted">
          No live quests yet. Apply migration 100008 so `loyalty_quests` exists, then they appear here.
        </div>
      )}

      {active.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {active.map((q) => {
            const pct = q.steps ? (q.done / q.steps) * 100 : 0;
            return (
              <div key={q.id} className="card p-5 space-y-4">
                <div className="text-sm font-bold text-text-primary">{q.name}</div>
                <div className="text-xs text-text-muted">{q.description}</div>
                <div className="text-xs text-text-muted">{q.done}/{q.steps} steps</div>
                <div className="h-2 w-full rounded-full bg-base-overlay overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {available.map((q) => (
        <div key={q.id} className="card px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{q.name}</div>
            <div className="text-xs text-text-muted">{q.description}</div>
          </div>
          <span className={cn('text-[10px] font-bold rounded-full px-2 py-0.5')} style={STATUS_CONFIG.available}>
            Available
          </span>
        </div>
      ))}

      {completed.map((q) => (
        <div key={q.id} className="card px-5 py-4 opacity-70 flex items-center gap-3">
          <Zap className="h-4 w-4 text-status-success" />
          <div>
            <div className="text-sm">{q.name}</div>
            <div className="text-xs text-text-muted">{q.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getLoyaltySnapshotAction } from '@/app/actions/loyalty';

export default function ProgressionPage() {
  const [tier, setTier] = useState('STREET');
  const [pct, setPct] = useState(0);
  const [xp, setXp] = useState(0);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await getLoyaltySnapshotAction();
      if (result.success) {
        setTier(result.data.tier);
        setPct(result.data.progressPct);
        setXp(result.data.xp);
        setNext(result.data.nextTier);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-3xl font-black">Progression</h1>
      <p className="text-sm text-text-muted">Street / Playr / Legend from live SPRR balance. Seed/Bloom demo tiers removed.</p>
      <div className="card p-6 space-y-2">
        <div className="text-2xl font-black">{tier}</div>
        <div className="text-sm">{pct}% to {next ?? 'max'}</div>
        <div className="text-sm text-text-muted">{xp} XP</div>
      </div>
    </div>
  );
}

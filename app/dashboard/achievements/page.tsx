'use client';

import { useEffect, useState } from 'react';
import { getLoyaltySnapshotAction, type LoyaltyQuestView } from '@/app/actions/loyalty';

export default function AchievementsPage() {
  const [quests, setQuests] = useState<LoyaltyQuestView[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await getLoyaltySnapshotAction();
      if (result.success) setQuests(result.data.quests);
      setLoaded(true);
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-3xl font-black">Achievements</h1>
      <p className="text-sm text-text-muted">Mapped from live loyalty_quests. No demo unlocks.</p>
      {!loaded && <p className="text-sm text-text-muted">Loading…</p>}
      {loaded && quests.length === 0 && (
        <p className="text-sm text-text-muted">No live quests yet.</p>
      )}
      {quests.map((q) => (
        <div key={q.id} className="card p-4">
          <div className="font-semibold">{q.name}</div>
          <div className="text-sm text-text-muted">{q.description}</div>
          <div className="text-xs mt-1">{q.done}/{q.steps} · {q.status}</div>
        </div>
      ))}
    </div>
  );
}

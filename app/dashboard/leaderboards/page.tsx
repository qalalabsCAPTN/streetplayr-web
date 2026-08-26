'use client';

import { useEffect, useState } from 'react';
import { getLeaderboardAction } from '@/app/actions/loyalty';

export default function LeaderboardsPage() {
  const [rows, setRows] = useState<Array<{ rank: number; name: string; xp: number; sprr: number; isSelf: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await getLeaderboardAction();
      if (!result.success) setError(result.error);
      else setRows(result.data);
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-3xl font-black">Leaderboards</h1>
      <p className="text-sm text-text-muted">Ranked by live profiles.xp. No demo names.</p>
      {error && <p className="text-sm text-status-error">{error}</p>}
      {rows.length === 0 && !error && <p className="text-sm text-text-muted">Loading…</p>}
      <div className="card divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={`${row.rank}-${row.name}`} className="px-4 py-3 flex justify-between text-sm">
            <span>#{row.rank} {row.name}{row.isSelf ? ' (you)' : ''}</span>
            <span className="font-mono">{row.xp} XP · {row.sprr} SPRR</span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getActivityAction } from '@/app/actions/loyalty';

export default function ActivityPage() {
  const [rows, setRows] = useState<Array<{ id: string; source: string; delta: number; createdAt: string }>>([]);

  useEffect(() => {
    (async () => {
      const result = await getActivityAction();
      if (result.success) {
        setRows(result.data.map((t) => ({ id: t.id, source: t.source, delta: t.delta, createdAt: t.createdAt })));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-3xl font-black">Activity</h1>
      <p className="text-sm text-text-muted">Live wallet_transactions only.</p>
      {rows.length === 0 && <p className="text-sm text-text-muted">No ledger rows yet.</p>}
      <div className="card divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.id} className="px-4 py-3 text-sm flex justify-between">
            <span>{row.source}</span>
            <span className="font-mono">{row.delta > 0 ? '+' : ''}{row.delta} · {new Date(row.createdAt).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

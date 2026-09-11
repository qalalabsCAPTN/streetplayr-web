'use client';

import { useState } from 'react';
import { pullUniwareInventoryAction } from '@/app/actions/ops/inventory-sync';

export default function PullUniwareInventoryButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg('');
          const res = await pullUniwareInventoryAction();
          setBusy(false);
          setMsg(
            res.success
              ? `Pulled Uniware. Written ${res.written ?? 0}, zeros ${res.explicitZero ?? 0}, matched ${res.processed ?? 0}.`
              : res.error || 'Pull failed'
          );
        }}
        className="border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white disabled:opacity-50"
      >
        {busy ? 'Pulling Uniware…' : 'Pull inventory from Uniware'}
      </button>
      {msg ? <p className="max-w-sm text-right font-mono text-[10px] text-[var(--ops-text-secondary)]">{msg}</p> : null}
    </div>
  );
}

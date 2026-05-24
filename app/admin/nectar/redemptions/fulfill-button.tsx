'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function RedemptionFulfillButton({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleFulfill() {
    if (state !== 'idle') return;
    setState('loading');

    try {
      const res = await fetch(`/api/admin/nectar/fulfill/${id}`, { method: 'POST' });
      if (res.ok) {
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Fulfilled
      </span>
    );
  }

  if (state === 'error') {
    return <span className="text-xs text-status-error">Failed</span>;
  }

  return (
    <button
      onClick={handleFulfill}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-status-success/10 border border-status-success/20 text-status-success rounded-lg hover:bg-status-success/20 transition-colors disabled:opacity-50"
    >
      {state === 'loading' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      {state === 'loading' ? 'Processing…' : 'Mark Fulfilled'}
    </button>
  );
}

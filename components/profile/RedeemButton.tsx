'use client';

import { useState } from 'react';
import { Gift, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RedeemButtonProps {
  currentBalance: number;
  campaignName: string;
  campaignId: string;
  sprrCost: number;
}

type State = 'idle' | 'loading' | 'success' | 'error';

export function RedeemButton({
  currentBalance,
  campaignName,
  campaignId,
  sprrCost,
}: RedeemButtonProps) {
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const canAfford = currentBalance >= sprrCost;

  async function handleRedeem() {
    if (!canAfford || state === 'loading') return;
    setState('loading');
    setMessage('');

    try {
      const res = await fetch('/api/nectar/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Redeemed: ${campaignName}`,
          sprrCost,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setState('error');
        setMessage(data.error ?? 'Redemption failed. Please try again.');
        return;
      }

      setState('success');
      setNewBalance(data.newBalance);
      setMessage(`Redeemed! New balance: ${data.newBalance.toLocaleString()} SP-RR`);
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-status-success">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {message}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleRedeem}
        disabled={!canAfford || state === 'loading'}
        className={[
          'inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-[0.15em] transition-all',
          canAfford && state !== 'loading'
            ? 'bg-[#ddb7ff]/10 border border-[#ddb7ff]/30 text-[#ddb7ff] hover:bg-[#ddb7ff]/20 hover:border-[#ddb7ff]/60 cursor-pointer'
            : 'bg-white/[0.03] border border-white/[0.06] text-white/25 cursor-not-allowed',
        ].join(' ')}
      >
        {state === 'loading' ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Gift className="h-3 w-3" />
        )}
        {state === 'loading' ? 'Redeeming…' : `Redeem · ${sprrCost.toLocaleString()} SP-RR`}
      </button>

      {!canAfford && (
        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-status-error/70">
          Need {(sprrCost - currentBalance).toLocaleString()} more SP-RR
        </p>
      )}

      {state === 'error' && (
        <p className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.1em] text-status-error">
          <AlertCircle className="h-2.5 w-2.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}

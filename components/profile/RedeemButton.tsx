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
      <div className="acct-redeem__success">
        <CheckCircle2 size={14} />
        {message}
      </div>
    );
  }

  return (
    <div className="acct-redeem">
      <button
        onClick={handleRedeem}
        disabled={!canAfford || state === 'loading'}
        className={`acct-redeem__btn ${canAfford && state !== 'loading' ? '' : 'disabled'}`}
      >
        {state === 'loading' ? <Loader2 size={13} className="acct-spin" /> : <Gift size={13} />}
        {state === 'loading' ? 'Redeeming…' : `Redeem · ${sprrCost.toLocaleString()} SP-RR`}
      </button>

      {!canAfford && (
        <p className="acct-redeem__hint">
          Need {(sprrCost - currentBalance).toLocaleString()} more SP-RR
        </p>
      )}

      {state === 'error' && (
        <p className="acct-redeem__error">
          <AlertCircle size={11} />
          {message}
        </p>
      )}
    </div>
  );
}

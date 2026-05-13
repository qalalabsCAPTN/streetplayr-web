'use client';

import { useState } from 'react';
import { adjustWalletAction } from '@/app/actions/ops/wallets';
import { useRouter } from 'next/navigation';

export function WalletAdminPanel() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const result = await adjustWalletAction(userId, delta, reason);
    if (result.success) {
      setMessage('Adjustment applied');
      setDelta(0);
      setReason('');
      setUserId('');
      router.refresh();
    } else {
      setMessage(`Error: ${result.error}`);
    }
    setSaving(false);
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
          Manual Adjustment
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
        <input
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
        />
        <input
          type="number"
          placeholder="Delta (+/- SPRR)"
          value={delta}
          onChange={(e) => setDelta(Number(e.target.value))}
          required
          className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
        />
        <input
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full border border-[var(--sp-accent)]/30 px-4 py-3 text-[9px] font-mono text-[var(--sp-accent)] uppercase tracking-widest"
        >
          {saving ? 'Processing...' : 'Apply Adjustment'}
        </button>
        {message && (
          <p className="text-[10px] font-mono text-[var(--ops-text-secondary)]">{message}</p>
        )}
      </form>
    </section>
  );
}

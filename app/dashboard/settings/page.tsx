'use client';

import { useEffect, useState } from 'react';
import { getLoyaltySnapshotAction } from '@/app/actions/loyalty';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      const result = await getLoyaltySnapshotAction();
      if (result.success) {
        setEmail(result.data.email);
        setTier(result.data.tier);
        setBalance(result.data.sprrBalance);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-3xl font-black">Settings</h1>
      <p className="text-sm text-text-muted">Live profile from the signed-in account.</p>
      <div className="card p-5 space-y-2 text-sm">
        <div>Email: {email || '—'}</div>
        <div>Tier: {tier || '—'}</div>
        <div>SPRR: {balance}</div>
      </div>
    </div>
  );
}

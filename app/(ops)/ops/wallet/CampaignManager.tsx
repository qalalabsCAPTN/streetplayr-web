'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CampaignManager() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sprrReward, setSprrReward] = useState(0);
  const [xpReward, setXpReward] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/nectar/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sprrReward,
          xpReward,
          isActive: true,
          startsAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('create failed');
      setName('');
      setDescription('');
      setSprrReward(0);
      setXpReward(0);
      setShowForm(false);
      router.refresh();
    } catch {
      // keep form open on failure
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Campaign Manager</span>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-[8px] font-mono text-[var(--sp-accent)] uppercase tracking-widest border border-[var(--sp-accent)]/30 px-3 py-1 cursor-pointer"
        >
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 p-4 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <input
            placeholder="Campaign name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="SP-RR reward"
              value={sprrReward}
              onChange={(e) => setSprrReward(Number(e.target.value))}
              className="bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
            />
            <input
              type="number"
              placeholder="XP reward"
              value={xpReward}
              onChange={(e) => setXpReward(Number(e.target.value))}
              className="bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full border border-[var(--sp-accent)]/30 px-3 py-2 text-[9px] font-mono text-[var(--sp-accent)] uppercase tracking-widest cursor-pointer"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      )}
    </div>
  );
}

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
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const admin = createAdminClient();
      await admin.from('bonus_campaigns').insert({
        name,
        description,
        sprr_reward: sprrReward,
        xp_reward: xpReward,
        is_active: true,
        starts_at: new Date().toISOString(),
      });
      setName('');
      setDescription('');
      setSprrReward(0);
      setXpReward(0);
      setShowForm(false);
      router.refresh();
    } catch {}
    setSaving(false);
  }

  async function handleToggle(id: string, active: boolean) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    await admin.from('bonus_campaigns').update({ is_active: active }).eq('id', id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Campaign Manager</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[8px] font-mono text-[var(--sp-accent)] uppercase tracking-widest border border-[var(--sp-accent)]/30 px-3 py-1"
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
            className="w-full border border-[var(--sp-accent)]/30 px-3 py-2 text-[9px] font-mono text-[var(--sp-accent)] uppercase tracking-widest"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      )}
    </div>
  );
}

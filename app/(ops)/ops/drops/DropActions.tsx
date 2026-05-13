'use client';

import { useState } from 'react';
import { toggleCollectionStatusAction, linkProductToCollectionAction } from '@/app/actions/ops/drops';
import { useRouter } from 'next/navigation';

export function DropActions({ collectionId, isActive }: { collectionId: string; isActive: boolean }) {
  const router = useRouter();
  const [showLink, setShowLink] = useState(false);
  const [productId, setProductId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    await toggleCollectionStatusAction(collectionId, !isActive);
    setSaving(false);
    router.refresh();
  }

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await linkProductToCollectionAction(collectionId, productId);
    setProductId('');
    setShowLink(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex gap-4 mt-4">
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`px-4 py-2 text-[9px] font-mono uppercase tracking-widest border transition-all ${
          isActive
            ? 'border-green-400/30 text-green-400 hover:bg-green-400/10'
            : 'border-[var(--ops-border-subtle)] text-[var(--ops-text-muted)] hover:border-white/30'
        }`}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        onClick={() => setShowLink(!showLink)}
        className="px-4 py-2 text-[9px] font-mono uppercase tracking-widest border border-[var(--sp-accent)]/30 text-[var(--sp-accent)]"
      >
        {showLink ? 'Cancel' : 'Link Product'}
      </button>
      {showLink && (
        <form onSubmit={handleLink} className="flex gap-2">
          <input
            placeholder="Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white w-48"
          />
          <button type="submit" disabled={saving} className="px-3 py-2 text-[9px] font-mono border border-[var(--sp-accent)]/30 text-[var(--sp-accent)]">
            Add
          </button>
        </form>
      )}
    </div>
  );
}

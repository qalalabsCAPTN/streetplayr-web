'use client';

import { useState } from 'react';
import { upsertVariantAction, updateProductStatusAction } from '@/app/actions/ops/products';
import { useRouter } from 'next/navigation';

export function ProductActions({ productId, currentStatus, isActive }: { productId: string; currentStatus: string; isActive: boolean }) {
  const router = useRouter();
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [stock, setStock] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await upsertVariantAction({ product_id: productId, color, size, stock_quantity: stock });
    setColor('');
    setSize('');
    setStock(0);
    setShowVariantForm(false);
    setSaving(false);
    router.refresh();
  }

  async function handleStatusChange(status: string) {
    await updateProductStatusAction(productId, status);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
        <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2 block">Status</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {['draft', 'active', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1 text-[9px] font-mono uppercase tracking-widest border transition-all ${
                currentStatus === s
                  ? 'border-[var(--sp-accent)] text-[var(--sp-accent)] bg-[var(--sp-accent)]/10'
                  : 'border-[var(--ops-border-subtle)] text-[var(--ops-text-muted)] hover:border-white/30'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
        <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2 block">Visibility</span>
        <div className={`text-lg font-mono uppercase tracking-wider ${isActive ? 'text-green-400' : 'text-red-400/60'}`}>
          {isActive ? 'Published' : 'Unpublished'}
        </div>
      </div>

      <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Variant Manager</span>
          <button
            onClick={() => setShowVariantForm(!showVariantForm)}
            className="text-[8px] font-mono text-[var(--sp-accent)] uppercase tracking-widest border border-[var(--sp-accent)]/30 px-3 py-1"
          >
            {showVariantForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
        {showVariantForm && (
          <form onSubmit={handleAddVariant} className="space-y-3">
            <input
              placeholder="Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
            />
            <input
              placeholder="Size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
            />
            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full bg-transparent border border-[var(--ops-border-subtle)] px-3 py-2 text-[10px] font-mono text-white"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full border border-[var(--sp-accent)]/30 px-3 py-2 text-[9px] font-mono text-[var(--sp-accent)] uppercase tracking-widest"
            >
              {saving ? 'Saving...' : 'Save Variant'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

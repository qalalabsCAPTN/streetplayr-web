'use client';

import { create } from 'zustand';
import { useAuthStore } from '@/store/authStore';
import { tryonSavesAdapter } from '@/lib/tryon-saves/adapter';
import type { TryOnSave } from '@/lib/tryon-saves/types';

interface TryOnSaveState {
  items: TryOnSave[];
  hydrated: boolean;
  syncing: boolean;
  hydrate: () => Promise<void>;
  addLocal: (item: TryOnSave) => void;
  remove: (id: string) => Promise<void>;
}

function dedupe(items: TryOnSave[]): TryOnSave[] {
  const seen = new Set<string>();
  const out: TryOnSave[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export const useTryOnSaveStore = create<TryOnSaveState>((set, get) => ({
  items: [],
  hydrated: false,
  syncing: false,

  hydrate: async () => {
    const userId = useAuthStore.getState().user?.id ?? null;
    if (!userId) {
      set({ items: [], hydrated: true, syncing: false });
      return;
    }

    set({ syncing: true });
    const local = tryonSavesAdapter.loadLocal(userId);

    try {
      const res = await fetch('/api/ai-tryon/saves');
      if (res.ok) {
        const data = (await res.json()) as { items?: TryOnSave[] };
        const remote = Array.isArray(data.items) ? data.items : [];
        const merged = dedupe([...remote, ...local]);
        tryonSavesAdapter.replaceLocal(userId, merged);
        set({ items: merged, hydrated: true, syncing: false });
        return;
      }
    } catch {
      /* fall through to local */
    }

    set({ items: local, hydrated: true, syncing: false });
  },

  addLocal: (item) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const next = tryonSavesAdapter.upsertLocal(userId, item);
    set({ items: next });
  },

  remove: async (id) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const next = tryonSavesAdapter.removeLocal(userId, id);
    set({ items: next });

    try {
      await fetch(`/api/ai-tryon/saves?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      /* local already updated */
    }
  },
}));

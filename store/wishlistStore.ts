'use client';

import { create } from 'zustand';
import { useAuthStore } from '@/store/authStore';
import { wishlistAdapter } from '@/lib/wishlist/adapter';

export type WishlistItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  addedAt: number;
};

type PendingAction =
  | { type: 'add'; item: WishlistItem }
  | { type: 'toggle'; item: WishlistItem }
  | null;

interface WishlistState {
  items: WishlistItem[];
  hydrated: boolean;
  syncing: boolean;
  pending: PendingAction;
  loginOpen: boolean;
  setHydrated: () => void;
  setLoginOpen: (open: boolean) => void;
  isSaved: (productId: string) => boolean;
  hydrate: () => Promise<void>;
  requestToggle: (item: WishlistItem) => 'added' | 'removed' | 'login_required';
  flushPending: () => Promise<'added' | 'removed' | null>;
  clearPending: () => void;
  remove: (productId: string) => Promise<void>;
}

function dedupe(items: WishlistItem[]): WishlistItem[] {
  const seen = new Set<string>();
  const out: WishlistItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  hydrated: false,
  syncing: false,
  pending: null,
  loginOpen: false,

  setHydrated: () => set({ hydrated: true }),
  setLoginOpen: (open) => set({ loginOpen: open }),

  isSaved: (productId) => get().items.some((i) => i.id === productId),

  hydrate: async () => {
    const userId = useAuthStore.getState().user?.id ?? null;
    set({ syncing: true });
    try {
      const items = await wishlistAdapter.load(userId);
      set({ items: dedupe(items), hydrated: true, syncing: false });
    } catch {
      set({ hydrated: true, syncing: false });
    }
  },

  requestToggle: (item) => {
    const authed = useAuthStore.getState().isAuthenticated;
    const userId = useAuthStore.getState().user?.id;
    if (!authed || !userId) {
      set({ pending: { type: 'toggle', item }, loginOpen: true });
      return 'login_required';
    }
    const exists = get().items.some((i) => i.id === item.id);
    if (exists) {
      const next = get().items.filter((i) => i.id !== item.id);
      set({ items: next });
      void wishlistAdapter.remove(userId, item.id);
      return 'removed';
    }
    const nextItem = { ...item, addedAt: Date.now() };
    set({ items: dedupe([nextItem, ...get().items]) });
    void wishlistAdapter.add(userId, nextItem);
    return 'added';
  },

  flushPending: async () => {
    const pending = get().pending;
    const userId = useAuthStore.getState().user?.id;
    if (!pending || !userId) return null;
    set({ pending: null, loginOpen: false });
    await get().hydrate();
    const exists = get().items.some((i) => i.id === pending.item.id);
    if (pending.type === 'toggle' && exists) {
      await get().remove(pending.item.id);
      return 'removed';
    }
    set({ items: dedupe([{ ...pending.item, addedAt: Date.now() }, ...get().items]) });
    await wishlistAdapter.add(userId, pending.item);
    return 'added';
  },

  clearPending: () => set({ pending: null }),

  remove: async (productId) => {
    const userId = useAuthStore.getState().user?.id;
    set({ items: get().items.filter((i) => i.id !== productId) });
    if (userId) await wishlistAdapter.remove(userId, productId);
  },
}));

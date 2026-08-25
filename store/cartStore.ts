import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isRemovedApparelSize } from '@/lib/products/sizes';

// SSR-safe storage — no localStorage access during server-side render/build
const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

export type CartItem = {
  /** Canonical line identity = product_variants.id (UUID). Never handle|size. */
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  image: string;
};

interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  error: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  hydrateItems: (items: CartItem[]) => void;
  syncWithDB: () => Promise<void>;
  mergeCartAfterLogin: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
  _scheduleSync: () => void;
}

let _syncTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      error: null,

      addItem: (newItem) => {
        if (isRemovedApparelSize(newItem.size)) return;
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) => item.id === newItem.id);
          let updatedItems;
          if (existingItemIndex !== -1) {
            updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
          } else {
            updatedItems = [...state.items, newItem];
          }
          get()._scheduleSync();
          return { items: updatedItems, error: null };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== id);
          get()._scheduleSync();
          return { items: updatedItems, error: null };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          );
          get()._scheduleSync();
          return { items: updatedItems, error: null };
        });
      },

      clearCart: () => {
        set({ items: [] });
        get()._scheduleSync();
      },

      hydrateItems: (items) => {
        set({ items: items.filter((item) => !isRemovedApparelSize(item.size)), error: null });
      },

      _scheduleSync: () => {
        if (_syncTimer) clearTimeout(_syncTimer);
        _syncTimer = setTimeout(() => get().syncWithDB(), 800);
      },

      syncWithDB: async () => {
        const { items } = get();
        set({ isSyncing: true });
        try {
          const { syncCartAction } = await import('@/app/actions/cart');
          const result = await syncCartAction(items);
          if (!result.success) {
            set({
              error: ('reason' in result && result.reason) || 'Sync failed',
              isSyncing: false,
            });
            return;
          }
          set({ isSyncing: false, error: null });
        } catch (e) {
          console.warn('[Cart] Background sync failed.', e);
          set({ isSyncing: false, error: 'Sync failed' });
        }
      },

      mergeCartAfterLogin: async () => {
        const currentItems = get().items;
        try {
          const { pullCartAction } = await import('@/app/actions/cart');
          const dbItems = await pullCartAction();
          if (!dbItems || dbItems.length === 0) {
            // No DB items — sync local cart to server
            await get().syncWithDB();
            return;
          }
          const localMap = new Map(currentItems.map((i) => [i.id, i]));
          const merged: CartItem[] = [...currentItems].filter((i) => !isRemovedApparelSize(i.size));
          for (const dbItem of dbItems) {
            if (isRemovedApparelSize(dbItem.size)) continue;
            if (!localMap.has(dbItem.id)) {
              merged.push(dbItem);
            }
          }
          set({ items: merged, error: null });
          await get().syncWithDB();
        } catch (e) {
          console.warn('[Cart] Merge failed, keeping local cart.', e);
        }
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'streetplayr-cart',
      storage: ssrSafeStorage,
      merge: (persisted, current) => {
        const incoming = (persisted as Partial<CartState> | undefined) ?? {};
        const items = (incoming.items ?? current.items).filter(
          (item) => !isRemovedApparelSize(item.size)
        );
        return { ...current, ...incoming, items };
      },
    }
  )
);

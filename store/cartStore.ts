import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  id: string; // Unique id combining product id + color + size
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
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  hydrateItems: (items: CartItem[]) => void;
  syncWithDB: () => Promise<void>;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) => item.id === newItem.id);
          let updatedItems;
          if (existingItemIndex !== -1) {
            updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
          } else {
            updatedItems = [...state.items, newItem];
          }
          // Optimistic local update, then sync
          setTimeout(() => get().syncWithDB(), 500); 
          return { items: updatedItems };
        });
      },
      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== id);
          setTimeout(() => get().syncWithDB(), 500);
          return { items: updatedItems };
        });
      },
      updateQuantity: (id, quantity) => {
        set((state) => {
          const updatedItems = state.items.map((item) => 
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          );
          setTimeout(() => get().syncWithDB(), 500);
          return { items: updatedItems };
        });
      },
      clearCart: () => {
        set({ items: [] });
        setTimeout(() => get().syncWithDB(), 500);
      },
      hydrateItems: (items) => {
        set({ items });
      },
      syncWithDB: async () => {
        // Simple debounce check could be added here with a timestamp
        const { items } = get();
        try {
          const { syncCartAction } = await import('@/app/actions/cart');
          await syncCartAction(items);
        } catch (e) {
          console.warn('[Cart] Background sync failed, will retry on next change.', e);
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
    }
  )
);

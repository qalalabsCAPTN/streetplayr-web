'use client';

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useCartStore, CartItem as ZustandCartItem } from '@/store/cartStore';

const CartCtx = createContext<any>(null);

/** Product payload for add-to-cart — variantId is required (product_variants.id). */
export type CartAddProduct = {
  handle: string;
  title: string;
  price: number;
  images?: string[];
  /** products.id when known */
  productId?: string;
  /** REQUIRED: product_variants.id — canonical cart line identity */
  variantId: string;
  color?: string;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const zustandCart = useCartStore();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useMemo(() => {
    if (!mounted) return [];
    return zustandCart.items.map((item) => ({
      key: item.id,
      product: {
        handle: item.productId,
        title: item.name,
        price: item.price,
        images: [item.image],
      },
      size: item.size,
      qty: item.quantity,
    }));
  }, [zustandCart.items, mounted]);

  const addItem = useCallback((product: CartAddProduct, size: string) => {
    if (!product?.variantId) {
      console.warn('[Cart] Rejected add-to-cart without variant UUID');
      setToast('Unable to add — missing variant');
      setTimeout(() => setToast(''), 2400);
      return;
    }

    const zustandItem: ZustandCartItem = {
      id: product.variantId,
      productId: product.productId || product.handle,
      name: product.title,
      price: product.price,
      quantity: 1,
      color: product.color || 'default',
      size: size,
      image: product.images?.[0] || '',
    };
    zustandCart.addItem(zustandItem);
    setOpen(true);
  }, [zustandCart]);

  const updateQty = useCallback((key: string, delta: number) => {
    const found = zustandCart.items.find((i) => i.id === key);
    if (found) {
      const newQty = found.quantity + delta;
      if (newQty <= 0) {
        zustandCart.removeItem(key);
      } else {
        zustandCart.updateQuantity(key, newQty);
      }
    }
  }, [zustandCart]);

  const removeItem = useCallback((key: string) => {
    zustandCart.removeItem(key);
  }, [zustandCart]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const total = items.reduce((n, i) => n + i.qty * i.product.price, 0);
    return { items, count, total, open, setOpen, addItem, updateQty, removeItem, toast, showToast };
  }, [items, open, addItem, updateQty, removeItem, toast, showToast]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const context = useContext(CartCtx);
  if (!context) {
    // Return safe fallback for SSR
    return {
      items: [],
      count: 0,
      total: 0,
      open: false,
      setOpen: () => {},
      addItem: () => {},
      updateQty: () => {},
      removeItem: () => {},
      toast: '',
      showToast: () => {},
    };
  }
  return context;
}

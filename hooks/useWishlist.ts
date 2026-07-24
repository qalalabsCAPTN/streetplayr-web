'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore, type WishlistItem } from '@/store/wishlistStore';
import { useCart } from '@/components/CartContext';

export function useWishlistActions() {
  const cart = useCart();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSaved = useWishlistStore((s) => s.isSaved);
  const requestToggle = useWishlistStore((s) => s.requestToggle);
  const flushPending = useWishlistStore((s) => s.flushPending);
  const loginOpen = useWishlistStore((s) => s.loginOpen);
  const setLoginOpen = useWishlistStore((s) => s.setLoginOpen);
  const clearPending = useWishlistStore((s) => s.clearPending);
  const items = useWishlistStore((s) => s.items);
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const result = await flushPending();
      if (cancelled) return;
      if (result === 'added') cart.showToast('Saved to wishlist');
      if (result === 'removed') cart.showToast('Removed from wishlist');
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, flushPending, cart]);

  const toggle = useCallback(
    (item: WishlistItem) => {
      const result = requestToggle(item);
      if (result === 'login_required') {
        cart.showToast('Sign in to save items');
        return;
      }
      cart.showToast(result === 'added' ? 'Saved to wishlist' : 'Removed from wishlist');
    },
    [requestToggle, cart]
  );

  return {
    items,
    isSaved,
    toggle,
    count: items.length,
    loginOpen,
    setLoginOpen,
    clearPending,
    pathname,
  };
}

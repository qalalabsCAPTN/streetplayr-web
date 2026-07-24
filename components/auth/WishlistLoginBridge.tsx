'use client';

/**
 * Mounts wishlist pending-flush after login.
 * Login UI is owned by Navbar's single LoginModal.
 */
import { useWishlistActions } from '@/hooks/useWishlist';

export default function WishlistLoginBridge() {
  useWishlistActions();
  return null;
}

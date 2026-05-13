'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, User } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

/**
 * AuthProvider — centralized hydration wrapper.
 * Handles zero-flicker sync between Server-side session and Client-side store.
 * Also manages cart merge after login.
 */
export default function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const sync = useAuthStore((s) => s.sync);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const mergeCartAfterLogin = useCartStore((s) => s.mergeCartAfterLogin);
  const initialized = useRef(false);
  const prevUser = useRef<User | null>(null);

  // Synchronous sync for initial render if possible
  if (!initialized.current) {
    sync(initialUser);
    initialized.current = true;
  }

  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  // Cart merge: detect login transition and merge guest cart into authenticated cart
  useEffect(() => {
    const wasLoggedOut = !prevUser.current;
    const justLoggedIn = initialUser && wasLoggedOut;
    prevUser.current = initialUser;

    if (justLoggedIn) {
      mergeCartAfterLogin();
    }
  }, [initialUser, mergeCartAfterLogin]);

  return <>{children}</>;
}

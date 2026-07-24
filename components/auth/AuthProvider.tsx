'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, User } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * AuthProvider — centralized hydration wrapper.
 * Handles zero-flicker sync between Server-side session and Client-side store.
 * Also manages cart merge after login + wishlist hydrate.
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
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const clientFallbackDone = useRef(false);
  const prevInitialUser = useRef<User | null | undefined>(undefined);
  const prevUser = useRef<User | null>(null);

  useEffect(() => {
    async function initAuth() {
      const prev = prevInitialUser.current;
      prevInitialUser.current = initialUser;

      const isSupabaseConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Soft login (email/OTP + router.refresh): SSR user arrives without remount
      if (initialUser) {
        sync(initialUser);
        setHydrated();
        void hydrateWishlist();
        return;
      }

      // Soft logout: SSR user cleared on refresh
      if (prev) {
        sync(null);
        setHydrated();
        return;
      }

      // First paint with no SSR user — try client session once
      if (clientFallbackDone.current) {
        setHydrated();
        return;
      }
      clientFallbackDone.current = true;

      if (isSupabaseConfigured) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { getProfileAction } = await import('@/app/actions/auth');
            const profile = await getProfileAction();
            sync(profile ?? null);
          } else {
            sync(null);
          }
        } catch (e) {
          console.error('[AuthProvider] Client-side session fallback check failed:', e);
          sync(null);
        }
      } else {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          sync(null);
        }
      }

      setHydrated();
      void hydrateWishlist();
    }

    initAuth();
  }, [initialUser, sync, setHydrated, hydrateWishlist]);

  // Cart merge: detect login transition and merge guest cart into authenticated cart
  useEffect(() => {
    const wasLoggedOut = !prevUser.current;
    const justLoggedIn = initialUser && wasLoggedOut;
    prevUser.current = initialUser;

    if (justLoggedIn) {
      mergeCartAfterLogin();
      void hydrateWishlist();
    }
  }, [initialUser, mergeCartAfterLogin, hydrateWishlist]);

  return <>{children}</>;
}

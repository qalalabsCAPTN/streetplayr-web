'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, User } from '@/store/authStore';

/**
 * AuthProvider — centralized hydration wrapper.
 * Handles zero-flicker sync between Server-side session and Client-side store.
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
  const initialized = useRef(false);

  // Synchronous sync for initial render if possible
  // (Zustand doesn't easily support this without a provider pattern, 
  // but we can use useEffect with a ref to avoid double-sync)
  if (!initialized.current) {
    sync(initialUser);
    initialized.current = true;
  }

  useEffect(() => {
    // Ensure hydrated flag is set
    setHydrated();
  }, [setHydrated]);

  return <>{children}</>;
}

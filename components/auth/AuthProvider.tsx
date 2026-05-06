'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthProvider — centralized hydration wrapper.
 *
 * Zustand persist rehydrates from localStorage asynchronously.
 * Without this, the navbar and profile will flash "logged out"
 * for one render tick. This component marks hydration complete
 * via `setHydrated()` which is called by Zustand's onRehydrateStorage.
 *
 * Usage: wrap in app/layout.tsx, above Navbar and children.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    // Ensure hydrated flag is set even if onRehydrateStorage fires before
    // this component mounts (e.g. no persisted state at all)
    setHydrated();
  }, [setHydrated]);

  return <>{children}</>;
}

'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, User } from '@/store/authStore';
import { getDemoTransactions } from '@/lib/auth/demo';

const IS_DEMO = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_AUTH === 'true';

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
  const transactions = useAuthStore((s) => s.transactions);
  const initialized = useRef(false);
  const seeded = useRef(false);

  // Synchronous sync for initial render if possible
  if (!initialized.current) {
    const seedTx = initialUser && IS_DEMO && transactions.length === 0
      ? getDemoTransactions()
      : undefined;
    sync(initialUser, seedTx);
    seeded.current = !!seedTx;
    initialized.current = true;
  }

  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  // Seed demo transactions after hydration if not already done
  useEffect(() => {
    if (initialUser && IS_DEMO && !seeded.current && transactions.length === 0) {
      seeded.current = true;
      sync(initialUser, getDemoTransactions());
    }
  }, [initialUser, transactions.length, sync]);

  return <>{children}</>;
}

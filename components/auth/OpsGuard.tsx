'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { isOpsRole } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/gateway';

/**
 * OpsGuard — client-side route guard for OpsOS routes.
 *
 * Middleware + layout double protection. Client-side guard provides
 * immediate UX feedback (no round-trip for redirect) while middleware
 * provides server-side enforcement.
 *
 * Role check uses the canonical isOpsRole() from permissions.ts,
 * ensuring one source of truth for role definitions.
 */
export default function OpsGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const role = (user as { role?: UserRole } | null)?.role;
    if (!role || !isOpsRole(role)) {
      router.push('/home');
    }
  }, [isHydrated, isAuthenticated, user, router, pathname]);

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  const role = (user as { role?: UserRole } | null)?.role;
  if (!role || !isOpsRole(role)) return null;

  return <>{children}</>;
}

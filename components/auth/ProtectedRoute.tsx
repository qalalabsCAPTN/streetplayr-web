'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute — client-side route guard.
 *
 * Reads auth state from Zustand. If not authenticated and hydration
 * is complete, redirects to /login with the current path as ?redirect=
 * so the user is returned after sign in.
 *
 * Does NOT redirect until hydration is complete, preventing false
 * redirects on first load before localStorage is read.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isAuthenticated, router, pathname]);

  // During hydration, render nothing to avoid flash
  if (!isHydrated) return null;

  // After hydration, if not authenticated, render nothing (redirect in flight)
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

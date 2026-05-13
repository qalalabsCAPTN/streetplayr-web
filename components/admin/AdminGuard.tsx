'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectIsOpsRole } from '@/store/authStore';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOps = useAuthStore(selectIsOpsRole);

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) { router.replace('/login?redirect=/admin'); }
      else if (!isOps) { router.replace('/'); }
    }
  }, [isHydrated, isAuthenticated, isOps, router]);

  if (!isHydrated || !isAuthenticated || !isOps) {
    return (
      <div className="admin-root">
        <div className="admin-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="dash-loading-pulse" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

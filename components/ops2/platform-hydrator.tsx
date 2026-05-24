'use client';

import { useEffect } from 'react';
import { usePlatformStore } from '@/stores/ops2/platform-store';

// ============================================================
// PlatformHydrator — fires loadSitesFromDB once on admin mount.
// Renders nothing. Drop into AdminLayout as a sibling of Sidebar.
// ============================================================

export function PlatformHydrator() {
  const { loadSitesFromDB, isHydrated } = usePlatformStore();

  useEffect(() => {
    if (!isHydrated) {
      loadSitesFromDB();
    }
  }, [isHydrated, loadSitesFromDB]);

  return null;
}

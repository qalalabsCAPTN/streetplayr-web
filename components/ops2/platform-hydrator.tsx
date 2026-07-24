'use client';

import { useEffect } from 'react';
import { usePlatformStore } from '@/stores/ops2/platform-store';

type InitialSite = {
  id: string;
  slug: string;
  name: string;
  color: string | null;
};

// ============================================================
// PlatformHydrator — hydrates sites from SSR props when available,
// otherwise falls back to loadSitesFromDB (server action) once.
// Renders nothing. Drop into AdminLayout as a sibling of Sidebar.
// ============================================================

export function PlatformHydrator({ initialSites }: { initialSites?: InitialSite[] }) {
  const { hydrateSites, loadSitesFromDB, isHydrated } = usePlatformStore();

  useEffect(() => {
    if (isHydrated) return;

    if (initialSites && initialSites.length > 0) {
      hydrateSites(initialSites);
      return;
    }

    void loadSitesFromDB();
  }, [isHydrated, initialSites, hydrateSites, loadSitesFromDB]);

  return null;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type PlatformId, PLATFORMS, type Platform } from '@/types/ops2/ops';
import { listSitesAction, setActiveSiteAction } from '@/app/actions/ops/admin-settings';

interface PlatformStore {
  activePlatformId: PlatformId;
  activePlatform: Platform;
  allPlatforms: Platform[];
  isHydrated: boolean;
  setPlatform: (id: PlatformId) => void;
  hydrateSites: (sites: SiteRow[]) => void;
  loadSitesFromDB: () => Promise<void>;
}

interface SiteRow {
  id: string;
  slug: string;
  name: string;
  color: string | null;
}

function siteRowToPlatform(row: SiteRow): Platform & { uuid: string } {
  const slug = row.slug as PlatformId;
  const existing = PLATFORMS.find(p => p.id === slug);
  if (existing) return { ...existing, uuid: row.id };
  return {
    id:          slug,
    label:       row.name,
    color:       row.color ?? '#6366F1',
    accentClass: `text-platform-${slug}`,
    bgClass:     `bg-platform-${slug}/10`,
    textClass:   `text-platform-${slug}`,
    badgeClass:  `bg-platform-${slug}/15 text-platform-${slug} border-platform-${slug}/30`,
    active:      true,
    uuid:        row.id,
  };
}

function mergeSitesIntoPlatforms(sites: SiteRow[], currentId: PlatformId) {
  const allOption = PLATFORMS[0]!;
  const sitePlatforms = sites.map(row => siteRowToPlatform(row));
  const merged: Platform[] = [allOption, ...sitePlatforms];
  const stillValid = merged.find(p => p.id === currentId);
  return {
    allPlatforms:     merged,
    activePlatform:   stillValid ?? allOption,
    activePlatformId: (stillValid ? currentId : 'all') as PlatformId,
    isHydrated:       true,
  };
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set, get) => ({
      activePlatformId: 'all',
      activePlatform:   PLATFORMS[0]!,
      allPlatforms:     PLATFORMS,
      isHydrated:       false,

      setPlatform: (id: PlatformId) => {
        const platform = get().allPlatforms.find(p => p.id === id) ?? get().allPlatforms[0]!;
        // Optimistic local update
        set({ activePlatformId: id, activePlatform: platform });

        if (id === 'all') return;

        const site = get().allPlatforms.find(p => p.id === id) as (Platform & { uuid?: string }) | undefined;
        if (site?.uuid) {
          void setActiveSiteAction(site.uuid).catch(() => { /* silent */ });
        }
      },

      hydrateSites: (sites: SiteRow[]) => {
        if (!sites.length) {
          set({ isHydrated: true });
          return;
        }
        set(mergeSitesIntoPlatforms(sites, get().activePlatformId));
      },

      loadSitesFromDB: async () => {
        try {
          const res = await listSitesAction();
          const active = (res.data ?? []).filter(s => s.is_active);
          if (!res.success || active.length === 0) {
            set({ isHydrated: true });
            return;
          }
          set(mergeSitesIntoPlatforms(
            active.map(s => ({ id: s.id, slug: s.slug, name: s.name, color: s.color })),
            get().activePlatformId
          ));
        } catch {
          set({ isHydrated: true });
        }
      },
    }),
    {
      name: 'nectar-ops-platform',
      partialize: (state) => ({ activePlatformId: state.activePlatformId }),
    }
  )
);

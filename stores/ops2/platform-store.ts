import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type PlatformId, PLATFORMS, type Platform } from '@/types/ops2/ops';
import { getSupabaseClient } from '@/lib/ops2/supabase';

interface PlatformStore {
  activePlatformId: PlatformId;
  activePlatform: Platform;
  allPlatforms: Platform[];
  isHydrated: boolean;
  setPlatform: (id: PlatformId) => void;
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

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set, get) => ({
      activePlatformId: 'all',
      activePlatform:   PLATFORMS[0]!,
      allPlatforms:     PLATFORMS,
      isHydrated:       false,

      setPlatform: (id: PlatformId) => {
        const platform = get().allPlatforms.find(p => p.id === id) ?? get().allPlatforms[0]!;
        set({ activePlatformId: id, activePlatform: platform });
        try {
          const db = getSupabaseClient();
          db.auth.getUser().then(({ data }) => {
            if (!data.user || id === 'all') return;
            const site = get().allPlatforms.find(p => p.id === id) as (Platform & { uuid?: string }) | undefined;
            if (site?.uuid) {
              db.from('profiles').update({ active_site_id: site.uuid }).eq('id', data.user.id);
            }
          });
        } catch { /* silent */ }
      },

      loadSitesFromDB: async () => {
        try {
          const db = getSupabaseClient();
          const { data, error } = await db
            .from('sites')
            .select('id, slug, name, color')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (error || !data || data.length === 0) { set({ isHydrated: true }); return; }

          const allOption = PLATFORMS[0]!;
          const sitePlatforms = (data as SiteRow[]).map(row => siteRowToPlatform(row));
          const merged: Platform[] = [allOption, ...sitePlatforms];

          const currentId = get().activePlatformId;
          const stillValid = merged.find(p => p.id === currentId);
          set({
            allPlatforms:     merged,
            activePlatform:   stillValid ?? allOption,
            activePlatformId: stillValid ? currentId : 'all',
            isHydrated:       true,
          });
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type PlatformId, PLATFORMS, type Platform } from '@/types/ops2/ops';
import { getSupabaseClient } from '@/lib/ops2/supabase';

// ============================================================
// PlatformStore — global platform/site context.
// Starts with static PLATFORMS fallback, then hydrates from
// the `sites` table in Supabase on first load.
// Changing platform scopes all admin queries without nav change.
// ============================================================

interface PlatformStore {
  activePlatformId: PlatformId;
  activePlatform: Platform;
  allPlatforms: Platform[];
  isHydrated: boolean;

  setPlatform: (id: PlatformId) => void;
  loadSitesFromDB: () => Promise<void>;
}

/** DB sites row shape */
interface SiteRow {
  id: string;
  slug: string;
  name: string;
  color: string | null;
}

/** Convert a DB sites row into the Platform shape */
function siteRowToPlatform(row: SiteRow): Platform & { uuid: string } {
  const slug = row.slug as PlatformId;
  // Reuse static config if it exists (preserves CSS class names)
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

        // Persist active_site_id to profiles table (best effort)
        try {
          const db = getSupabaseClient();
          db.auth.getUser().then(({ data }) => {
            if (!data.user || id === 'all') return;
            const site = get().allPlatforms.find(p => p.id === id) as (Platform & { uuid?: string }) | undefined;
            if (site?.uuid) {
              db.from('profiles')
                .update({ active_site_id: site.uuid })
                .eq('id', data.user.id);
            }
          });
        } catch {
          // Silently ignore — UI preference, not critical path
        }
      },

      loadSitesFromDB: async () => {
        try {
          const db = getSupabaseClient();
          const { data, error } = await db
            .from('sites')
            .select('id, slug, name, color')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (error || !data || data.length === 0) {
            set({ isHydrated: true });
            return;
          }

          const allOption = PLATFORMS[0]!;  // 'all' entry always first
          const sitePlatforms = data.map(row => siteRowToPlatform(row as SiteRow));
          const merged: Platform[] = [allOption, ...sitePlatforms];

          // If persisted active platform is no longer valid, reset to 'all'
          const currentId = get().activePlatformId;
          const stillValid = merged.find(p => p.id === currentId);

          set({
            allPlatforms:    merged,
            activePlatform:  stillValid ?? allOption,
            activePlatformId: stillValid ? currentId : 'all',
            isHydrated:      true,
          });
        } catch {
          // Network/auth failure — keep static fallback, mark hydrated
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

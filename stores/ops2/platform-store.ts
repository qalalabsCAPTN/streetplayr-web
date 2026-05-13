import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type PlatformId, PLATFORMS, type Platform } from '@/types/ops2/ops';

interface PlatformStore {
  activePlatformId: PlatformId;
  activePlatform: Platform;
  setPlatform: (id: PlatformId) => void;
  allPlatforms: Platform[];
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set) => ({
      activePlatformId: 'all',
      activePlatform: PLATFORMS[0]!,
      allPlatforms: PLATFORMS,

      setPlatform: (id: PlatformId) => {
        const platform = PLATFORMS.find(p => p.id === id) ?? PLATFORMS[0]!;
        set({ activePlatformId: id, activePlatform: platform });
      },
    }),
    {
      name: 'nectar-ops-platform',
      partialize: (state) => ({ activePlatformId: state.activePlatformId }),
    }
  )
);

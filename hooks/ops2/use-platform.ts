'use client';

import { usePlatformStore } from '@/stores/ops2/platform-store';
import type { PlatformId } from '@/types/ops2/ops';

export function usePlatform() {
  const { activePlatformId, activePlatform, setPlatform, allPlatforms } = usePlatformStore();

  return {
    platformId: activePlatformId,
    platform: activePlatform,
    setPlatform,
    allPlatforms,
    isAll: activePlatformId === 'all',
    apiParam: activePlatformId === 'all' ? undefined : activePlatformId,
  };
}

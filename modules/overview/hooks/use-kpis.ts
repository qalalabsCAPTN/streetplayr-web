'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/ops2/api-client';
import type { EcosystemKPIs } from '@/types/ops2/ops';
import { usePlatform } from '@/hooks/ops2/use-platform';

export function useEcosystemKPIs(period: '1d' | '7d' | '30d' = '7d') {
  const { apiParam } = usePlatform();

  return useQuery({
    queryKey: ['kpis', apiParam, period],
    queryFn: () => api.get<EcosystemKPIs>('/overview/kpis', { platform: apiParam, period }),
    refetchInterval: 60_000,
  });
}

export function useRecentEvents(limit = 20) {
  const { apiParam } = usePlatform();

  return useQuery({
    queryKey: ['recent-events', apiParam],
    queryFn: () => api.get<{ events: Record<string, unknown>[] }>('/nectar/events', { platform: apiParam, limit }),
    refetchInterval: 10_000,
  });
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions<T> {
  table: string;
  event?: ChangeEvent;
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T, old: Partial<T>) => void;
  onDelete?: (old: Partial<T>) => void;
  enabled?: boolean;
}

export function useRealtimeTable<T = Record<string, unknown>>({
  table, event = '*', filter, onInsert, onUpdate, onDelete, enabled = true,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    switch (payload.eventType) {
      case 'INSERT':
        onInsert?.(payload.new as T);
        break;
      case 'UPDATE':
        onUpdate?.(payload.new as T, payload.old as Partial<T>);
        break;
      case 'DELETE':
        onDelete?.(payload.old as Partial<T>);
        break;
    }
  }, [onInsert, onUpdate, onDelete]);

  useEffect(() => {
    if (!enabled) return;

    const client = getSupabaseClient();
    const channelName = `nectar-ops:${table}:${filter ?? 'all'}`;

    channelRef.current = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        handleChange
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [table, event, filter, handleChange, enabled]);
}

import { useState } from 'react';

interface UseEventStreamOptions {
  limit?: number;
  platformFilter?: string;
  siteIdFilter?: string;
  enabled?: boolean;
}

export function useRealtimeEventStream({
  limit = 50,
  platformFilter,
  siteIdFilter,
  enabled = true,
}: UseEventStreamOptions = {}) {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);

  useRealtimeTable({
    table: 'events',
    event: 'INSERT',
    filter: siteIdFilter ? `site_id=eq.${siteIdFilter}` : platformFilter ? `platform=eq.${platformFilter}` : undefined,
    enabled,
    onInsert: (record) => {
      setEvents(prev => [record as Record<string, unknown>, ...prev].slice(0, limit));
    },
  });

  return events;
}

export function useRealtimeTransactions(enabled = true) {
  const [latestTx, setLatestTx] = useState<Record<string, unknown> | null>(null);

  useRealtimeTable({
    table: 'wallet_transactions',
    event: 'INSERT',
    enabled,
    onInsert: (record) => setLatestTx(record as Record<string, unknown>),
  });

  return latestTx;
}

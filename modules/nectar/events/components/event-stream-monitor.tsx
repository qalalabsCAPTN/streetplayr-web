'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, RefreshCw, AlertTriangle, CheckCircle2, Clock, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import { formatRelativeTime, formatDateTime } from '@/lib/ops2/format';
import { PlatformBadge, Badge } from '@/components/ops2/ui/badge';
import { StatusDot } from '@/components/ops2/ui/status-dot';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import { api } from '@/lib/ops2/api-client';
import { useRealtimeEventStream } from '@/hooks/ops2/use-realtime';
import { usePlatform } from '@/hooks/ops2/use-platform';

type TabKey = 'stream' | 'failed' | 'queue';

interface EventRecord {
  id: string;
  event_type: string;
  platform: string;
  actor_user_id: string;
  status: string;
  processing_attempts: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
  payload?: Record<string, unknown>;
}

const STATUS_BADGE: Record<string, { variant: 'success' | 'error' | 'warning' | 'info' | 'muted'; label: string }> = {
  processed:    { variant: 'success', label: 'processed' },
  failed:       { variant: 'error',   label: 'failed' },
  dead_lettered:{ variant: 'error',   label: 'dead letter' },
  processing:   { variant: 'info',    label: 'processing' },
  queued:       { variant: 'warning', label: 'queued' },
  received:     { variant: 'muted',   label: 'received' },
};

export function EventStreamMonitor() {
  const [activeTab, setActiveTab] = useState<TabKey>('stream');
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const { apiParam } = usePlatform();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: siteId } = useQuery({
    queryKey: ['site-id', apiParam],
    queryFn: async () => {
      if (!apiParam) return undefined;
      const db = getSupabaseClient();
      const { data } = await db.from('sites').select('id').eq('slug', apiParam).single();
      return data?.id as string | undefined;
    },
  });

  const realtimeEvents = useRealtimeEventStream({
    limit: 100,
    platformFilter: apiParam,
    siteIdFilter: siteId,
    enabled: !paused,
  });

  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['events', 'stream', apiParam, siteId],
    queryFn: async () => {
      const db = getSupabaseClient();
      let query = db.from('events').select('id, event_type, platform, actor_user_id, status, processing_attempts, error_message, created_at, processed_at, payload').order('created_at', { ascending: false }).limit(100);
      if (siteId) query = query.eq('site_id', siteId);
      const { data } = await query;
      return { events: (data ?? []) as EventRecord[] };
    },
    refetchInterval: paused ? false : 15_000,
  });

  const { data: failedData } = useQuery({
    queryKey: ['events', 'failed', apiParam, siteId],
    queryFn: async () => {
      const db = getSupabaseClient();
      let query = db.from('events').select('id, event_type, platform, actor_user_id, status, processing_attempts, error_message, created_at, processed_at, payload').in('status', ['failed', 'dead_lettered']).order('created_at', { ascending: false }).limit(50);
      if (siteId) query = query.eq('site_id', siteId);
      const { data } = await query;
      return { events: (data ?? []) as EventRecord[] };
    },
    refetchInterval: 30_000,
  });

  const replayMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/nectar/events/${eventId}/replay`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const events: EventRecord[] = realtimeEvents.length > 0
    ? (realtimeEvents as unknown as EventRecord[])
    : (historicalData?.events ?? []);

  const failed: EventRecord[] = failedData?.events ?? [];

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'stream', label: 'Live Stream' },
    { key: 'failed', label: 'Failed / DLQ', count: failed.length },
    { key: 'queue',  label: 'Queue Health' },
  ];

  return (
    <div className="flex h-full gap-5">
      <div className="flex-1 flex flex-col surface overflow-hidden min-w-0">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          <div className="flex gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                  activeTab === tab.key
                    ? 'bg-base-overlay text-text-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-base-elevated'
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="rounded-full bg-status-error/20 text-status-error text-[10px] px-1.5 py-0.5 font-semibold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {activeTab === 'stream' && (
            <>
              <StatusDot status={paused ? 'offline' : 'live'} label={paused ? 'Paused' : 'Live'} />
              <button
                onClick={() => setPaused(!paused)}
                className="btn-ghost gap-1.5 text-xs"
              >
                {paused
                  ? <><Play className="h-3.5 w-3.5" /> Resume</>
                  : <><Pause className="h-3.5 w-3.5" /> Pause</>
                }
              </button>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })}
                className="btn-ghost"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {activeTab === 'stream' && (
            <div className="divide-y divide-border-subtle">
              {isLoading && events.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-nectar-400/30 border-t-nectar-400 animate-spin" />
                    <span className="text-sm text-text-muted">Loading events...</span>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <EmptyState
                  title="No events yet"
                  description="Events from connected platforms will appear here in realtime."
                />
              ) : (
                events.map((event, i) => {
                  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE['received']!;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelected(selected?.id === event.id ? null : event)}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-3 hover:bg-base-elevated/50 transition-colors text-left',
                        selected?.id === event.id && 'bg-base-elevated',
                        i === 0 && !paused && 'animate-stream-in'
                      )}
                    >
                      <div className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0',
                        event.status === 'processed'    ? 'bg-status-success' :
                        event.status === 'failed' || event.status === 'dead_lettered' ? 'bg-status-error' :
                        event.status === 'processing'   ? 'bg-status-info animate-pulse' :
                        'bg-text-muted'
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-text-primary font-medium">
                            {event.event_type}
                          </span>
                          <PlatformBadge platform={event.platform} />
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {event.processing_attempts > 1 && (
                            <Badge variant="warning">{event.processing_attempts}× attempts</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs font-mono text-text-muted truncate">{event.id}</span>
                          <span className="text-xs text-text-muted shrink-0">
                            {formatRelativeTime(event.created_at)}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className={cn(
                        'h-4 w-4 text-text-muted shrink-0 transition-transform duration-150',
                        selected?.id === event.id && 'rotate-90'
                      )} />
                    </button>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'failed' && (
            <div>
              {failed.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  title="No failed events"
                  description="All events have been processed successfully."
                />
              ) : (
                <div className="divide-y divide-border-subtle">
                  {failed.map(event => (
                    <div key={event.id} className="flex items-start gap-3 px-5 py-4 hover:bg-base-elevated/50">
                      <AlertTriangle className="h-4 w-4 text-status-error shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-text-primary">{event.event_type}</span>
                          <PlatformBadge platform={event.platform} />
                          <Badge variant="error">
                            {event.status === 'dead_lettered' ? 'dead letter' : 'failed'}
                          </Badge>
                        </div>
                        {event.error_message && (
                          <p className="text-xs text-status-error mt-1 font-mono">{event.error_message}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-text-muted font-mono">{event.id}</span>
                          <span className="text-xs text-text-muted">{event.processing_attempts} attempts</span>
                          <span className="text-xs text-text-muted">{formatDateTime(event.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => replayMutation.mutate(event.id)}
                        disabled={replayMutation.isPending}
                        className="btn-secondary text-xs gap-1.5 shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Replay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'queue' && <QueueHealth />}
        </div>
      </div>

      {selected && (
        <div className="w-80 shrink-0 surface flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">Event Inspector</span>
            <button onClick={() => setSelected(null)} className="btn-ghost p-1">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider">Event ID</div>
              <div className="code break-all">{selected.id}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider">Type</div>
              <div className="font-mono text-sm text-nectar-400">{selected.event_type}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider">Status</div>
              <Badge variant={STATUS_BADGE[selected.status]?.variant ?? 'muted'}>
                {STATUS_BADGE[selected.status]?.label ?? selected.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider">Platform</div>
              <PlatformBadge platform={selected.platform} />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider">Actor</div>
              <div className="code break-all">{selected.actor_user_id}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider">Timestamp</div>
              <div className="text-xs text-text-secondary">{formatDateTime(selected.created_at)}</div>
            </div>
            {selected.payload && (
              <div className="space-y-2">
                <div className="text-xs text-text-muted uppercase tracking-wider">Payload</div>
                <pre className="text-xs bg-base-overlay border border-border rounded-lg p-3 overflow-x-auto text-text-secondary font-mono whitespace-pre-wrap">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QueueHealth() {
  const metrics = [
    { label: 'Queue Depth',     value: '42',    status: 'success' as const },
    { label: 'Processing Rate', value: '380/min', status: 'success' as const },
    { label: 'Failed (DLQ)',    value: '3',     status: 'error'   as const },
    { label: 'Worker Instances',value: '4',     status: 'success' as const },
    { label: 'Avg Latency',     value: '1.2s',  status: 'success' as const },
    { label: 'Redis Mem',       value: '48 MB', status: 'success' as const },
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="surface-elevated p-4 flex flex-col gap-2">
            <span className="text-xs text-text-muted">{m.label}</span>
            <div className="flex items-center gap-2">
              <StatusDot status={m.status === 'success' ? 'live' : 'error'} />
              <span className="text-lg font-bold text-text-primary">{m.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-elevated p-4 space-y-3">
        <div className="section-title">Worker Status</div>
        {[
          { id: 'worker-1', queue: 'event-processing', status: 'healthy' as const },
          { id: 'worker-2', queue: 'event-processing', status: 'healthy' as const },
          { id: 'worker-3', queue: 'reward-execution', status: 'healthy' as const },
          { id: 'worker-4', queue: 'progression',      status: 'healthy' as const },
        ].map(w => (
          <div key={w.id} className="flex items-center gap-3">
            <StatusDot status="live" />
            <span className="text-sm text-text-secondary font-mono flex-1">{w.id}</span>
            <span className="text-xs text-text-muted">{w.queue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

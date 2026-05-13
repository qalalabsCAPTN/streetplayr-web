'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/ops2/cn';
import { formatRelativeTime } from '@/lib/ops2/format';
import { PlatformBadge } from '@/components/ops2/ui/badge';
import { StatusDot } from '@/components/ops2/ui/status-dot';
import { useRealtimeEventStream } from '@/hooks/ops2/use-realtime';
import type { PlatformId } from '@/types/ops2/ops';

const EVENT_TYPE_COLORS: Record<string, string> = {
  'purchase.completed':    'text-status-success',
  'purchase.refunded':     'text-status-error',
  'game.completed':        'text-platform-game',
  'membership.renewed':    'text-platform-club',
  'membership.activated':  'text-platform-club',
  'referral.converted':    'text-nectar-400',
  'reward.executed':       'text-nectar-400',
  'wallet.credited':       'text-status-success',
  'achievement.unlocked':  'text-status-warning',
};

interface EventRow {
  id: string;
  event_type: string;
  platform: string;
  actor_user_id: string;
  created_at: string;
}

export function LiveEventFeed({ platformFilter }: { platformFilter?: string }) {
  const realtimeEvents = useRealtimeEventStream({
    limit: 30,
    platformFilter,
  });

  const [seeded, setSeeded] = useState(false);
  const [seedEvents, setSeedEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!seeded) {
      setSeedEvents([
        { id: '1', event_type: 'purchase.completed',   platform: 'streetplayr', actor_user_id: 'usr_...aB3', created_at: new Date(Date.now() - 12000).toISOString() },
        { id: '2', event_type: 'game.completed',        platform: 'playr-game',  actor_user_id: 'usr_...xZ9', created_at: new Date(Date.now() - 34000).toISOString() },
        { id: '3', event_type: 'referral.converted',    platform: 'streetplayr', actor_user_id: 'usr_...m7K', created_at: new Date(Date.now() - 61000).toISOString() },
        { id: '4', event_type: 'membership.renewed',    platform: 'playr-club',  actor_user_id: 'usr_...qP2', created_at: new Date(Date.now() - 145000).toISOString() },
        { id: '5', event_type: 'achievement.unlocked',  platform: 'playr-game',  actor_user_id: 'usr_...rR5', created_at: new Date(Date.now() - 290000).toISOString() },
      ]);
      setSeeded(true);
    }
  }, [seeded]);

  const display: EventRow[] = realtimeEvents.length > 0
    ? (realtimeEvents as unknown as EventRow[])
    : seedEvents;

  return (
    <div className="surface flex flex-col" style={{ minHeight: 320 }}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="section-title">Event Stream</span>
          <StatusDot status="live" label="Live" />
        </div>
        <span className="text-xs text-text-muted">{display.length} recent</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {display.map((event, i) => (
          <div
            key={event.id}
            className={cn(
              'flex items-center gap-3 px-5 py-3 hover:bg-base-elevated/50 transition-colors',
              i === 0 && realtimeEvents.length > 0 && 'animate-stream-in'
            )}
          >
            <div className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0 mt-0.5',
              event.event_type.includes('refund') ? 'bg-status-error' :
              event.event_type.includes('purchase') || event.event_type.includes('credited') ? 'bg-status-success' :
              event.event_type.includes('referral') || event.event_type.includes('reward') ? 'bg-nectar-400' :
              'bg-text-muted'
            )} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-sm font-mono font-medium truncate',
                  EVENT_TYPE_COLORS[event.event_type] ?? 'text-text-primary'
                )}>
                  {event.event_type}
                </span>
                <PlatformBadge platform={event.platform as PlatformId} />
              </div>
              <div className="text-xs text-text-muted mt-0.5 font-mono truncate">
                {event.actor_user_id}
              </div>
            </div>

            <span className="text-xs text-text-muted shrink-0 tabular-nums">
              {formatRelativeTime(event.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

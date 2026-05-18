'use client';

import { useState, useEffect } from 'react';
import { Activity, Zap, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { StatusDot } from '@/components/ops2/ui/status-dot';
import { LiveEventFeed } from '@/modules/overview/components/live-event-feed';
import { useRealtimeEventStream, useRealtimeTransactions } from '@/hooks/ops2/use-realtime';

function useRollingCounter(latestChange: unknown) {
  const [counts, setCounts] = useState({ events: 0, rewards: 0, points: 0, users: new Set<string>() });

  useEffect(() => {
    if (!latestChange) return;
    setCounts(prev => {
      const next = { ...prev };
      next.events += 1;
      return next;
    });
  }, [latestChange]);

  return counts;
}

export function LiveOpsCenter() {
  const [sessionStart] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const realtimeEvents = useRealtimeEventStream({ limit: 200 });
  const latestTx = useRealtimeTransactions();

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  const eventsPerMin = elapsed > 0 ? Math.round((realtimeEvents.length / elapsed) * 60) : 0;
  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const liveMetrics = [
    { label: 'Events / min', value: eventsPerMin, icon: Activity,   accent: 'text-status-success' },
    { label: 'Events (session)', value: realtimeEvents.length, icon: Zap, accent: 'text-nectar-400' },
    { label: 'Session duration', value: formatElapsed(elapsed), icon: TrendingUp, accent: 'text-blue-400' },
    { label: 'Latest TX', value: latestTx ? '✓' : '—', icon: Users, accent: 'text-purple-400' },
  ];

  return (
    <div className="flex flex-col gap-5 flex-1">
      <div className="grid grid-cols-4 gap-4">
        {liveMetrics.map(m => {
          const Icon: any = m.icon;
          return (
            <div key={m.label} className="surface p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-base-elevated border border-border flex items-center justify-center">
                <Icon className={cn('h-5 w-5', m.accent)} />
              </div>
              <div>
                <div className="text-xs text-text-muted">{m.label}</div>
                <div className={cn('text-2xl font-bold tabular-nums', m.accent)}>
                  {String(m.value)}
                </div>
              </div>
              <div className="ml-auto">
                <StatusDot status="live" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-0">
        <LiveEventFeed />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import {
  Activity, Server, Clock, AlertTriangle, CheckCircle2,
  XCircle, Zap, ChevronRight, ChevronDown, Cpu, MemoryStick,
  RefreshCw, Pause,
} from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';
import {
  DEMO_TRACES,
  DEMO_QUEUE_METRICS,
  DEMO_WORKER_HEALTH,
  DEMO_LATENCY_SERIES,
  type EventTrace,
  type TraceSpan,
  type WorkerHealth,
} from '@/lib/ops2/demo/observability';

const SERVICE_COLORS: Record<string, string> = {
  api:    '#F97316',
  worker: '#6366F1',
  db:     '#10B981',
};

function SpanBar({ span, totalMs, traceStart }: { span: TraceSpan; totalMs: number; traceStart: number }) {
  const left = (span.startedAt / totalMs) * 100;
  const width = Math.max(0.5, (span.durationMs / totalMs) * 100);
  const color = SERVICE_COLORS[span.service] ?? '#94A3B8';

  return (
    <div className="flex items-center gap-3 py-0.5 group">
      <div className="w-48 shrink-0 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: color, marginLeft: `${span.parentSpanId ? 16 : 0}px` }}
        />
        <span className="text-[11px] text-text-muted truncate">{span.operation}</span>
      </div>
      <div className="flex-1 relative h-5">
        <div
          className={cn('absolute top-0 h-full rounded-sm flex items-center px-1 overflow-hidden', span.status === 'error' ? 'opacity-100' : 'opacity-80 group-hover:opacity-100')}
          style={{
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: span.status === 'error' ? '#EF444440' : `${color}30`,
            border: `1px solid ${span.status === 'error' ? '#EF444480' : `${color}60`}`,
          }}
        >
          {width > 8 && (
            <span className="text-[9px] font-mono truncate" style={{ color }}>
              {span.durationMs}ms
            </span>
          )}
        </div>
      </div>
      <div className="w-16 shrink-0 text-right">
        <span className={cn('text-[10px] font-mono', span.status === 'error' ? 'text-status-error' : 'text-text-muted')}>
          {span.durationMs}ms
        </span>
      </div>
    </div>
  );
}

function TraceRow({ trace }: { trace: EventTrace }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border-subtle last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-base-elevated/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2 w-6">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            : <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          }
        </div>
        <div className="w-24 shrink-0">
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            trace.status === 'completed' ? 'text-status-success' :
            trace.status === 'failed' ? 'text-status-error' : 'text-status-warning'
          )}>
            {trace.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
            {trace.status === 'failed' && <XCircle className="h-3 w-3" />}
            {trace.status.charAt(0).toUpperCase() + trace.status.slice(1)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-primary font-medium">{trace.eventType}</span>
            <span className="font-mono text-xs text-text-muted">{trace.traceId}</span>
          </div>
          <div className="text-xs text-text-muted">{trace.userId} · {trace.platform}</div>
        </div>
        <div className="text-right shrink-0">
          <div className={cn('text-sm font-mono font-semibold', trace.status === 'failed' ? 'text-status-error' : 'text-text-primary')}>
            {trace.totalDurationMs}ms
          </div>
          <div className="text-xs text-text-muted">{trace.spans.length} spans</div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 bg-base-elevated/20">
          <div className="border border-border rounded-xl p-4 space-y-0.5">
            <div className="flex items-center gap-3 pb-2 mb-1 border-b border-border-subtle">
              <div className="w-48 text-xs text-text-muted uppercase tracking-wider font-semibold">Span</div>
              <div className="flex-1 text-xs text-text-muted uppercase tracking-wider font-semibold">Timeline (0 → {trace.totalDurationMs}ms)</div>
              <div className="w-16 text-right text-xs text-text-muted uppercase tracking-wider font-semibold">Dur</div>
            </div>
            {trace.spans.map(span => (
              <SpanBar
                key={span.spanId}
                span={span}
                totalMs={trace.totalDurationMs}
                traceStart={0}
              />
            ))}
          </div>
          {trace.spans.filter(s => s.status === 'error').map(span => (
            <div key={span.spanId} className="mt-2 rounded-lg bg-status-error/10 border border-status-error/20 px-4 py-2.5">
              <div className="text-xs font-semibold text-status-error mb-1">{span.service}/{span.operation}</div>
              <div className="text-xs font-mono text-status-error/80">{span.error}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QueueCard({ q }: { q: typeof DEMO_QUEUE_METRICS[0] }) {
  const total = q.waiting + q.active + q.failed + q.delayed;
  return (
    <div className={cn('surface rounded-xl p-4', q.name === 'nectar:dead-letter' && 'border-status-warning/20')}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-text-primary">{q.displayName}</div>
          <div className="text-[11px] font-mono text-text-muted">{q.name}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {q.paused
            ? <Badge variant="warning"><Pause className="h-3 w-3 mr-1" />Paused</Badge>
            : <><span className="dot-live" /><Badge variant="success">Live</Badge></>
          }
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="rounded-lg bg-base-overlay p-2">
          <div className="text-text-muted">Waiting</div>
          <div className="font-semibold text-text-primary">{q.waiting}</div>
        </div>
        <div className="rounded-lg bg-base-overlay p-2">
          <div className="text-text-muted">Active</div>
          <div className="font-semibold text-status-success">{q.active}</div>
        </div>
        <div className="rounded-lg bg-base-overlay p-2">
          <div className="text-text-muted">Failed</div>
          <div className={cn('font-semibold', q.failed > 0 ? 'text-status-error' : 'text-text-muted')}>{q.failed}</div>
        </div>
        <div className="rounded-lg bg-base-overlay p-2">
          <div className="text-text-muted">Completed</div>
          <div className="font-semibold text-text-secondary">{(q.completed / 1000).toFixed(0)}k</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Rate</span>
        <span className="font-semibold text-nectar-300">{q.processingRate}/min</span>
      </div>
    </div>
  );
}

const WORKER_STATUS_CONFIG = {
  idle:       { color: 'text-text-muted', bg: 'bg-base-overlay', dot: 'bg-text-muted' },
  processing: { color: 'text-status-success', bg: 'bg-status-success/10', dot: 'bg-status-success' },
  stalled:    { color: 'text-status-error', bg: 'bg-status-error/10', dot: 'bg-status-error' },
  offline:    { color: 'text-text-muted/40', bg: 'bg-base-overlay/50', dot: 'bg-text-muted/40' },
};

function WorkerRow({ w }: { w: WorkerHealth }) {
  const cfg = WORKER_STATUS_CONFIG[w.status];
  return (
    <tr className="border-t border-border-subtle hover:bg-base-elevated/30 transition-colors">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', cfg.dot, w.status === 'processing' && 'animate-pulse')} />
          <span className="text-xs font-mono text-text-secondary">{w.workerId}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className={cn('text-xs font-medium capitalize px-2 py-0.5 rounded-md', cfg.bg, cfg.color)}>{w.status}</span>
      </td>
      <td className="px-4 py-2.5 text-xs text-text-secondary text-right">{(w.jobsProcessed / 1000).toFixed(1)}k</td>
      <td className="px-4 py-2.5 text-xs text-right">
        <span className={w.jobsFailed > 20 ? 'text-status-warning' : 'text-text-muted'}>{w.jobsFailed}</span>
      </td>
      <td className="px-4 py-2.5 text-xs font-mono text-text-secondary text-right">{w.avgProcessingMs}ms</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1">
          <Cpu className="h-3 w-3 text-text-muted" />
          <div className="h-1.5 w-16 rounded-full bg-base-overlay">
            <div className={cn('h-full rounded-full', w.cpuPct > 80 ? 'bg-status-warning' : 'bg-nectar-400')} style={{ width: `${w.cpuPct}%` }} />
          </div>
          <span className="text-[10px] text-text-muted">{w.cpuPct}%</span>
        </div>
      </td>
    </tr>
  );
}

function LatencyChart() {
  const maxVal = Math.max(...DEMO_LATENCY_SERIES.map(d => d.p99));
  const h = 80;

  const toY = (v: number) => h - (v / maxVal) * h;

  const pathFor = (key: 'p50' | 'p95' | 'p99') => {
    return DEMO_LATENCY_SERIES.map((d, i) => {
      const x = (i / (DEMO_LATENCY_SERIES.length - 1)) * 100;
      const y = toY(d[key]);
      return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
    }).join(' ');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1"><span className="h-px w-4 bg-nectar-400 inline-block" />p50</span>
        <span className="flex items-center gap-1"><span className="h-px w-4 bg-status-warning inline-block" />p95</span>
        <span className="flex items-center gap-1"><span className="h-px w-4 bg-status-error inline-block" />p99</span>
      </div>
      <div className="relative" style={{ height: h + 24 }}>
        <svg className="absolute inset-0 w-full" height={h} viewBox={`0 0 100% ${h}`} preserveAspectRatio="none">
          <path d={pathFor('p99')} fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.5" vectorEffect="non-scaling-stroke" />
          <path d={pathFor('p95')} fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.7" vectorEffect="non-scaling-stroke" />
          <path d={pathFor('p50')} fill="none" stroke="#F59E14" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-text-muted">
          {DEMO_LATENCY_SERIES.filter((_, i) => i % 4 === 0).map(d => (
            <span key={d.hour}>{d.hour}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        {(['p50', 'p95', 'p99'] as const).map(key => {
          const last = DEMO_LATENCY_SERIES[DEMO_LATENCY_SERIES.length - 1][key];
          return (
            <div key={key} className="rounded-lg bg-base-overlay px-3 py-2">
              <div className="text-text-muted">{key.toUpperCase()} (now)</div>
              <div className="font-mono font-semibold text-text-primary">{last}ms</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS = ['Traces', 'Queues', 'Workers', 'Latency'] as const;
type Tab = typeof TABS[number];

export default function ObservabilityPage() {
  const [tab, setTab] = useState<Tab>('Traces');

  const stalledWorkers = DEMO_WORKER_HEALTH.filter(w => w.status === 'stalled').length;
  const dlqSize = DEMO_QUEUE_METRICS.find(q => q.name === 'nectar:dead-letter')?.waiting ?? 0;
  const totalActive = DEMO_QUEUE_METRICS.reduce((s, q) => s + q.active, 0);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Observability" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-nectar-400" />
              </div>
              <div>
                <h2 className="page-title">Observability</h2>
                <p className="text-sm text-text-muted mt-0.5">Distributed traces, queue health, worker status, latency</p>
              </div>
            </div>
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {stalledWorkers > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-status-warning shrink-0" />
              <span className="text-sm text-status-warning font-medium">
                {stalledWorkers} worker{stalledWorkers > 1 ? 's' : ''} stalled — last heartbeat &gt;2 min ago. Check worker process health.
              </span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Active Jobs</div>
              <div className="metric-value text-status-success">{totalActive}</div>
              <div className="metric-subtext">across all queues</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Dead Letter Queue</div>
              <div className={cn('metric-value', dlqSize > 0 ? 'text-status-warning' : 'text-text-muted')}>{dlqSize}</div>
              <div className="metric-subtext">jobs pending review</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Stalled Workers</div>
              <div className={cn('metric-value', stalledWorkers > 0 ? 'text-status-error' : 'text-status-success')}>
                {stalledWorkers}
              </div>
              <div className="metric-subtext">of {DEMO_WORKER_HEALTH.length} total</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Failed Events (24h)</div>
              <div className="metric-value text-status-error">127</div>
              <div className="metric-subtext">0.07% error rate</div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-border pb-0">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === t
                    ? 'border-nectar-400 text-nectar-300'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Traces' && (
            <div className="surface rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div className="text-sm font-medium text-text-primary">Recent Event Traces</div>
                <span className="text-xs text-text-muted">Live · {DEMO_TRACES.length} shown</span>
              </div>
              {DEMO_TRACES.map(trace => (
                <TraceRow key={trace.traceId} trace={trace} />
              ))}
            </div>
          )}

          {tab === 'Queues' && (
            <div className="grid grid-cols-3 gap-4">
              {DEMO_QUEUE_METRICS.map(q => <QueueCard key={q.name} q={q} />)}
            </div>
          )}

          {tab === 'Workers' && (
            <div className="surface rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Worker ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Processed</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Failed</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Avg Latency</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">CPU</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_WORKER_HEALTH.map(w => <WorkerRow key={w.workerId} w={w} />)}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Latency' && (
            <div className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-text-primary">Processing Latency — Last 24h</div>
                <span className="text-xs text-text-muted">p50 / p95 / p99 · event-processing queue</span>
              </div>
              <LatencyChart />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

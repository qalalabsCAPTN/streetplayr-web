'use client';

import { useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import { Target, RefreshCw, Plus, Users, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';
import { DEMO_SEGMENTS, type Segment, type SegmentType } from '@/lib/ops2/demo/segments';

const TYPE_CONFIG: Record<SegmentType, { label: string; color: string }> = {
  static:      { label: 'Static',      color: 'text-text-muted' },
  dynamic:     { label: 'Dynamic',     color: 'text-status-success' },
  behavioral:  { label: 'Behavioral',  color: 'text-platform-playr' },
  predictive:  { label: 'Predictive',  color: 'text-nectar-300' },
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: '=', ne: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤',
  in: 'in', nin: 'not in', between: 'between',
};

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function SegmentCard({ segment, onClick }: { segment: Segment; onClick: () => void }) {
  const typeCfg = TYPE_CONFIG[segment.type];
  const totalSegmentUsers = DEMO_SEGMENTS.reduce((s, seg) => s + seg.estimatedSize, 0);

  return (
    <button
      onClick={onClick}
      className="surface rounded-xl p-5 text-left hover:border-border transition-all group w-full"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-nectar-300 transition-colors">
              {segment.name}
            </h3>
            <span className={cn('text-xs font-medium', typeCfg.color)}>{typeCfg.label}</span>
          </div>
          <p className="text-xs text-text-muted">{segment.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      <div className="space-y-1.5 mb-4">
        {segment.conditions.slice(0, 3).map(cond => (
          <div key={cond.id} className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-text-secondary">{cond.field}</span>
            <span className="text-text-muted">{OPERATOR_LABELS[cond.operator] ?? cond.operator}</span>
            <span className="font-mono text-nectar-300">{String(cond.value)}{cond.valueTo !== undefined && ` – ${cond.valueTo}`}</span>
          </div>
        ))}
        {segment.conditions.length > 3 && (
          <div className="text-xs text-text-muted">+{segment.conditions.length - 3} more conditions</div>
        )}
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">{fmt(segment.estimatedSize)} members</span>
          <span className="text-text-secondary">{((segment.estimatedSize / 42300) * 100).toFixed(1)}% of users</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-base-overlay">
          <div
            className="h-full rounded-full bg-nectar-400 transition-all"
            style={{ width: `${Math.min(100, (segment.estimatedSize / 42300) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {segment.tags.map(tag => (
            <span key={tag} className="rounded-md bg-base-overlay px-2 py-0.5 text-[10px] text-text-muted">{tag}</span>
          ))}
        </div>
        {segment.refreshIntervalMinutes && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <RefreshCw className="h-3 w-3" />
            {segment.refreshIntervalMinutes}m
          </div>
        )}
      </div>
    </button>
  );
}

export default function SegmentsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const totalMembers = DEMO_SEGMENTS.reduce((s, seg) => s + seg.estimatedSize, 0);
  const activeCount = DEMO_SEGMENTS.filter(s => s.status === 'active').length;

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Segments" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-platform-playr/10 border border-platform-playr/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-platform-playr" />
              </div>
              <div>
                <h2 className="page-title">Segmentation</h2>
                <p className="text-sm text-text-muted mt-0.5">Dynamic behavioral targeting — power campaigns and reward rules</p>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              New Segment
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Active Segments</div>
              <div className="metric-value text-status-success">{activeCount}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Members</div>
              <div className="metric-value">{fmt(totalMembers)}</div>
              <div className="metric-subtext">across all segments</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Dynamic Segments</div>
              <div className="metric-value text-nectar-300">
                {DEMO_SEGMENTS.filter(s => s.type === 'dynamic').length}
              </div>
              <div className="metric-subtext">auto-refreshing</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Behavioral</div>
              <div className="metric-value text-platform-playr">
                {DEMO_SEGMENTS.filter(s => s.type === 'behavioral').length}
              </div>
              <div className="metric-subtext">rule-evaluated</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {DEMO_SEGMENTS.map(seg => (
              <SegmentCard
                key={seg.id}
                segment={seg}
                onClick={() => setSelected(seg.id === selected ? null : seg.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

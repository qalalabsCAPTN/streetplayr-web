'use client';

import { useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import {
  ShieldAlert, AlertTriangle, XCircle, CheckCircle2,
  Eye, Ban, RotateCcw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';
import {
  DEMO_RISK_FLAGS,
  DEMO_RISK_SUMMARY,
  RISK_TYPE_LABELS,
  type RiskFlag,
  type RiskLevel,
} from '@/lib/ops2/demo/risk';

const LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  critical: { label: 'Critical', color: 'text-status-error',   bg: 'bg-status-error/10',   border: 'border-status-error/30',   icon: XCircle },
  high:     { label: 'High',     color: 'text-status-warning',  bg: 'bg-status-warning/10', border: 'border-status-warning/30', icon: AlertTriangle },
  medium:   { label: 'Medium',   color: 'text-yellow-400',      bg: 'bg-yellow-400/10',     border: 'border-yellow-400/30',     icon: AlertTriangle },
  low:      { label: 'Low',      color: 'text-text-muted',      bg: 'bg-base-overlay',      border: 'border-border-subtle',     icon: AlertTriangle },
};

const STATUS_ACTIONS: Record<RiskFlag['status'], { label: string; variant: string }> = {
  open:      { label: 'Open',      variant: 'warning' },
  reviewing: { label: 'Reviewing', variant: 'info' },
  resolved:  { label: 'Resolved',  variant: 'success' },
  dismissed: { label: 'Dismissed', variant: 'muted' },
};

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 90 ? '#EF4444' : score >= 70 ? '#F59E0B' : score >= 50 ? '#EAB308' : '#94A3B8';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-base-overlay overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono font-semibold" style={{ color }}>{score}</span>
    </div>
  );
}

function RiskFlagRow({ flag }: { flag: RiskFlag }) {
  const [expanded, setExpanded] = useState(false);
  const lvl = LEVEL_CONFIG[flag.level];
  const LvlIcon: any = lvl.icon;

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all', lvl.border, expanded && 'shadow-md')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-base-elevated/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2 w-5">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            : <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          }
        </div>
        <div className={cn('flex items-center gap-1.5 w-24 shrink-0', lvl.color)}>
          <LvlIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">{lvl.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{RISK_TYPE_LABELS[flag.type]}</span>
            <span className="text-xs font-mono text-text-muted">{flag.userId}</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{flag.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScoreMeter score={flag.score} />
          <Badge variant={STATUS_ACTIONS[flag.status].variant as any}>
            {STATUS_ACTIONS[flag.status].label}
          </Badge>
        </div>
      </button>

      {expanded && (
        <div className={cn('border-t px-6 py-4 space-y-4', lvl.border, lvl.bg)}>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Evidence</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(flag.evidence).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-base-surface border border-border-subtle px-3 py-2">
                  <div className="text-xs text-text-muted">{k.replace(/_/g, ' ')}</div>
                  <div className="text-xs font-mono font-semibold text-text-primary mt-0.5">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          {flag.status === 'open' || flag.status === 'reviewing' ? (
            <div className="flex items-center gap-2">
              <button className="btn-secondary flex items-center gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5" />
                Start Review
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-status-error/10 border border-status-error/20 px-3 py-1.5 text-xs font-medium text-status-error hover:bg-status-error/20 transition-colors">
                <Ban className="h-3.5 w-3.5" />
                Block User
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-base-overlay border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-secondary transition-colors">
                <RotateCcw className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </div>
          ) : (
            <div className="text-xs text-text-muted">
              {flag.resolvedBy && <span>Resolved by <strong className="text-text-secondary">{flag.resolvedBy}</strong></span>}
              {flag.resolvedAt && <span> · {new Date(flag.resolvedAt).toLocaleString()}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RiskPage() {
  const [statusFilter, setStatusFilter] = useState<RiskFlag['status'] | 'all'>('all');

  const filtered = statusFilter === 'all'
    ? DEMO_RISK_FLAGS
    : DEMO_RISK_FLAGS.filter(f => f.status === statusFilter);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Risk Engine" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-status-error" />
            </div>
            <div>
              <h2 className="page-title">Risk Engine</h2>
              <p className="text-sm text-text-muted mt-0.5">Velocity detection, anomaly scoring, fraud flags</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div className="metric-card border-status-error/20">
              <div className="metric-label">Critical</div>
              <div className="metric-value text-status-error">{DEMO_RISK_SUMMARY.criticalFlags}</div>
              <div className="metric-subtext">require immediate action</div>
            </div>
            <div className="metric-card border-status-warning/20">
              <div className="metric-label">High</div>
              <div className="metric-value text-status-warning">{DEMO_RISK_SUMMARY.highFlags}</div>
              <div className="metric-subtext">under investigation</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Medium</div>
              <div className="metric-value text-yellow-400">{DEMO_RISK_SUMMARY.mediumFlags}</div>
              <div className="metric-subtext">monitoring</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Blocked Users</div>
              <div className="metric-value text-status-error">{DEMO_RISK_SUMMARY.blockedUsers}</div>
              <div className="metric-subtext">auto-blocked today</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Resolved Today</div>
              <div className="metric-value text-status-success">{DEMO_RISK_SUMMARY.resolvedToday}</div>
              <div className="metric-subtext">of {DEMO_RISK_SUMMARY.totalFlagsToday} total</div>
            </div>
          </div>

          {DEMO_RISK_SUMMARY.criticalFlags > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-status-error/30 bg-status-error/5 px-4 py-3">
              <XCircle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-status-error mb-0.5">
                  {DEMO_RISK_SUMMARY.criticalFlags} critical flag{DEMO_RISK_SUMMARY.criticalFlags > 1 ? 's' : ''} require immediate attention
                </div>
                <div className="text-xs text-status-error/80">
                  Auto-block has been triggered for high-confidence violations. Review and confirm or lift blocks.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1 border-b border-border pb-0">
            {(['all', 'open', 'reviewing', 'resolved', 'dismissed'] as const).map(s => {
              const count = s === 'all' ? DEMO_RISK_FLAGS.length : DEMO_RISK_FLAGS.filter(f => f.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
                    statusFilter === s
                      ? 'border-nectar-400 text-nectar-300'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  )}
                >
                  {s === 'all' ? 'All' : s}
                  {count > 0 && <span className="ml-1.5 text-[10px] text-text-muted">({count})</span>}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filtered.map(flag => <RiskFlagRow key={flag.id} flag={flag} />)}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-3 opacity-30 text-status-success" />
              <p>No flags with status <strong>{statusFilter}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

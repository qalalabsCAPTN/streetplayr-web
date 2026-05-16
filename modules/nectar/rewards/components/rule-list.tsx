'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus, Zap, Edit2, ToggleLeft, ToggleRight, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { Badge, TierBadge } from '@/components/ops2/ui/badge';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import { api } from '@/lib/ops2/api-client';
import type { RewardRule } from '@nectar/types';

interface RuleListProps {
  onSelectRule: (rule: RewardRule) => void;
  onCreateRule: () => void;
  selectedId?: string;
}

const TYPE_COLORS: Record<string, string> = {
  points:     'text-nectar-400 bg-nectar-400/10 border-nectar-400/20',
  xp:         'text-blue-400 bg-blue-400/10 border-blue-400/20',
  multiplier: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  badge:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  drop:       'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export function RuleList({ onSelectRule, onCreateRule, selectedId }: RuleListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['reward-rules'],
    queryFn: () => api.get<{ rules: RewardRule[] }>('/nectar/rewards'),
  });

  const rules = data?.rules ?? [];

  return (
    <div className="surface flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
        <div>
          <span className="text-sm font-semibold text-text-primary">Reward Rules</span>
          <span className="ml-2 text-xs text-text-muted">{rules.length} rules</span>
        </div>
        <button onClick={onCreateRule} className="btn-primary text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Rule
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
        {isLoading ? (
          <div className="space-y-px p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-base-elevated animate-pulse" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={<Zap className="h-5 w-5" />}
            title="No reward rules"
            description="Create your first rule to start rewarding ecosystem behavior."
            action={<button onClick={onCreateRule} className="btn-primary text-xs">Create Rule</button>}
          />
        ) : (
          rules.map(rule => (
            <button
              key={rule.id}
              onClick={() => onSelectRule(rule)}
              className={cn(
                'w-full flex items-start gap-3 px-5 py-4 text-left',
                'hover:bg-base-elevated/50 transition-colors duration-100',
                selectedId === rule.id && 'bg-base-elevated border-l-2 border-nectar-400'
              )}
            >
              <div className={cn(
                'h-2 w-2 rounded-full shrink-0 mt-1.5',
                rule.status === 'active'   ? 'bg-status-success' :
                rule.status === 'draft'    ? 'bg-status-warning' :
                rule.status === 'archived' ? 'bg-text-muted' :
                'bg-text-muted'
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">{rule.name}</span>
                  <div className={cn(
                    'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wide',
                    TYPE_COLORS[rule.type] ?? TYPE_COLORS['points']
                  )}>
                    {rule.type}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    {rule.triggers.slice(0, 2).map(t => (
                      <span key={t} className="code text-[10px]">{t}</span>
                    ))}
                    {rule.triggers.length > 2 && (
                      <span className="text-[10px] text-text-muted">+{rule.triggers.length - 2}</span>
                    )}
                  </div>

                  <span className="text-xs text-nectar-400 font-semibold">
                    {rule.baseAmount.toLocaleString()} {rule.type}
                  </span>

                  {rule.cooldownSeconds && (
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />
                      <span>{rule.cooldownSeconds}s</span>
                    </div>
                  )}

                  {rule.maxUsagePerUser && (
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="h-3 w-3" />
                      <span>max {rule.maxUsagePerUser}×</span>
                    </div>
                  )}
                </div>

                {rule.eligibleTiers && rule.eligibleTiers.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {rule.eligibleTiers.map(t => (
                      <TierBadge key={t} tier={t} />
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

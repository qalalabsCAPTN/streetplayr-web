'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Zap, Play, Save, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { Badge } from '@/components/ops2/ui/badge';
import { api } from '@/lib/ops2/api-client';
import type { RewardRule, RuleCondition } from '@nectar/types';

const ALL_EVENT_TYPES = [
  'purchase.completed', 'purchase.refunded', 'purchase.first_order',
  'game.completed', 'game.level_up', 'game.daily_challenge_completed',
  'membership.activated', 'membership.renewed', 'membership.cancelled',
  'referral.converted', 'referral.signup_attributed',
  'review.submitted', 'content.shared', 'qr.scanned',
  'streak.maintained', 'achievement.unlocked',
  'drop.claimed', 'quest.completed',
  'profile.completed', 'platform.connected',
];

const CONDITION_OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains'] as const;
const RULE_TYPES = ['points', 'xp', 'multiplier', 'badge', 'drop'] as const;
const ALL_TIERS = ['seed', 'sprout', 'bloom', 'nectar', 'apex'] as const;

interface RuleBuilderProps {
  rule?: RewardRule;
  onSave?: () => void;
  onCancel?: () => void;
}

type RuleFormData = {
  name: string;
  description: string;
  type: string;
  triggers: string[];
  baseAmount: number;
  conditions: RuleCondition[];
  maxUsagePerUser: number | null;
  cooldownSeconds: number | null;
  eligibleTiers: string[];
  status: string;
};

function emptyForm(): RuleFormData {
  return {
    name: '',
    description: '',
    type: 'points',
    triggers: [],
    baseAmount: 100,
    conditions: [],
    maxUsagePerUser: null,
    cooldownSeconds: null,
    eligibleTiers: [],
    status: 'draft',
  };
}

function ruleToForm(rule: RewardRule): RuleFormData {
  return {
    name: rule.name,
    description: rule.description,
    type: rule.type,
    triggers: rule.triggers,
    baseAmount: rule.baseAmount,
    conditions: rule.conditions,
    maxUsagePerUser: rule.maxUsagePerUser ?? null,
    cooldownSeconds: rule.cooldownSeconds ?? null,
    eligibleTiers: rule.eligibleTiers ?? [],
    status: rule.status,
  };
}

export function RuleBuilder({ rule, onSave, onCancel }: RuleBuilderProps) {
  const [form, setForm] = useState<RuleFormData>(rule ? ruleToForm(rule) : emptyForm());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: RuleFormData) =>
      rule
        ? api.patch(`/nectar/rewards/${rule.id}`, data)
        : api.post('/nectar/rewards', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reward-rules'] });
      onSave?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/nectar/rewards/${rule!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reward-rules'] });
      onCancel?.();
    },
  });

  const testMutation = useMutation({
    mutationFn: (data: RuleFormData) => api.post('/nectar/rewards/test', data),
    onSuccess: (result: unknown) => {
      setTestResult(JSON.stringify(result, null, 2));
    },
  });

  function addCondition() {
    setForm(f => ({
      ...f,
      conditions: [...f.conditions, { field: 'payload.', operator: 'eq', value: '' }],
    }));
  }

  function updateCondition(i: number, update: Partial<RuleCondition>) {
    setForm(f => ({
      ...f,
      conditions: f.conditions.map((c, idx) => idx === i ? { ...c, ...update } : c),
    }));
  }

  function removeCondition(i: number) {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));
  }

  function toggleTrigger(et: string) {
    setForm(f => ({
      ...f,
      triggers: f.triggers.includes(et)
        ? f.triggers.filter(t => t !== et)
        : [...f.triggers, et],
    }));
  }

  function toggleTier(tier: string) {
    setForm(f => ({
      ...f,
      eligibleTiers: f.eligibleTiers.includes(tier)
        ? f.eligibleTiers.filter(t => t !== tier)
        : [...f.eligibleTiers, tier],
    }));
  }

  return (
    <div className="surface flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {rule ? 'Edit Rule' : 'New Rule'}
          </span>
          <Badge variant={form.status === 'active' ? 'success' : form.status === 'draft' ? 'warning' : 'muted'}>
            {form.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {rule && (
            <button
              onClick={() => testMutation.mutate(form)}
              disabled={testMutation.isPending}
              className="btn-ghost text-xs gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Test
            </button>
          )}
          {rule && (
            <button
              onClick={() => deleteMutation.mutate()}
              className="btn-ghost text-xs gap-1.5 text-status-error hover:bg-status-error/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="btn-ghost text-xs"><X className="h-4 w-4" /></button>
          )}
          <button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending || !form.name || form.triggers.length === 0}
            className="btn-primary text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        <div className="space-y-3">
          <div className="section-title">Basic Info</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1.5 block">Rule Name</label>
              <input
                className="field"
                placeholder="e.g. Purchase Reward"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Reward Type</label>
              <select
                className="field"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {RULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Base Amount</label>
              <input
                type="number"
                className="field"
                min={0}
                value={form.baseAmount}
                onChange={e => setForm(f => ({ ...f, baseAmount: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Status</label>
              <select
                className="field"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1.5 block">Description</label>
              <input
                className="field"
                placeholder="What does this rule reward?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="section-title">Event Triggers</div>
            <button
              onClick={() => setShowEventPicker(!showEventPicker)}
              className="btn-ghost text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add trigger
              <ChevronDown className={cn('h-3 w-3 transition-transform', showEventPicker && 'rotate-180')} />
            </button>
          </div>

          {form.triggers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.triggers.map(t => (
                <span key={t} className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-mono',
                  'bg-nectar-400/5 text-nectar-400 border-nectar-400/20'
                )}>
                  {t}
                  <button onClick={() => toggleTrigger(t)} className="ml-1 hover:text-status-error">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {showEventPicker && (
            <div className="bg-base-overlay border border-border rounded-xl p-2 grid grid-cols-1 gap-0.5 max-h-52 overflow-y-auto">
              {ALL_EVENT_TYPES.map(et => (
                <button
                  key={et}
                  onClick={() => toggleTrigger(et)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-left',
                    'transition-colors duration-100',
                    form.triggers.includes(et)
                      ? 'bg-nectar-400/10 text-nectar-400'
                      : 'text-text-secondary hover:bg-base-elevated hover:text-text-primary'
                  )}
                >
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                    form.triggers.includes(et) ? 'bg-nectar-400' : 'bg-text-muted')} />
                  {et}
                </button>
              ))}
            </div>
          )}

          {form.triggers.length === 0 && !showEventPicker && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-xs text-text-muted">No triggers selected. A rule must have at least one trigger.</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="section-title">Payload Conditions</div>
            <button onClick={addCondition} className="btn-ghost text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </button>
          </div>

          {form.conditions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-3 text-center">
              <p className="text-xs text-text-muted">No conditions — rule applies to all matching events.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.conditions.map((condition, i) => (
                <div key={i} className="flex items-center gap-2 bg-base-overlay rounded-lg p-2">
                  <input
                    className="field flex-1 text-xs font-mono"
                    placeholder="payload.orderTotal"
                    value={condition.field}
                    onChange={e => updateCondition(i, { field: e.target.value })}
                  />
                  <select
                    className="field w-24 text-xs"
                    value={condition.operator}
                    onChange={e => updateCondition(i, { operator: e.target.value as RuleCondition['operator'] })}
                  >
                    {CONDITION_OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input
                    className="field flex-1 text-xs"
                    placeholder="value"
                    value={String(condition.value ?? '')}
                    onChange={e => {
                      const raw = e.target.value;
                      const val = raw === 'true' ? true : raw === 'false' ? false : isNaN(Number(raw)) ? raw : Number(raw);
                      updateCondition(i, { value: val });
                    }}
                  />
                  <button onClick={() => removeCondition(i)} className="text-text-muted hover:text-status-error p-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="section-title">Validation & Limits</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Max Uses Per User</label>
              <input
                type="number"
                className="field"
                placeholder="Unlimited"
                min={1}
                value={form.maxUsagePerUser ?? ''}
                onChange={e => setForm(f => ({
                  ...f,
                  maxUsagePerUser: e.target.value ? parseInt(e.target.value) : null,
                }))}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Cooldown (seconds)</label>
              <input
                type="number"
                className="field"
                placeholder="No cooldown"
                min={0}
                value={form.cooldownSeconds ?? ''}
                onChange={e => setForm(f => ({
                  ...f,
                  cooldownSeconds: e.target.value ? parseInt(e.target.value) : null,
                }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="section-title">Tier Eligibility</div>
          <div className="flex gap-2 flex-wrap">
            {ALL_TIERS.map(tier => {
              const selected = form.eligibleTiers.length === 0 || form.eligibleTiers.includes(tier);
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-150',
                    form.eligibleTiers.includes(tier) || form.eligibleTiers.length === 0
                      ? tier === 'seed'   ? 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30' :
                        tier === 'sprout' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        tier === 'bloom'  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        tier === 'nectar' ? 'bg-nectar-400/10 text-nectar-400 border-nectar-400/30' :
                                            'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      : 'bg-base-elevated text-text-muted border-border opacity-40'
                  )}
                >
                  {tier}
                </button>
              );
            })}
            {form.eligibleTiers.length > 0 && (
              <button
                onClick={() => setForm(f => ({ ...f, eligibleTiers: [] }))}
                className="text-xs text-text-muted hover:text-text-secondary underline"
              >
                Clear (all tiers)
              </button>
            )}
          </div>
          <p className="text-xs text-text-muted">
            {form.eligibleTiers.length === 0
              ? 'No restriction — rule applies to all tiers.'
              : `Only applies to: ${form.eligibleTiers.join(', ')}`
            }
          </p>
        </div>

        {testResult && (
          <div className="space-y-2">
            <div className="section-title">Test Execution Result</div>
            <pre className="text-xs bg-base-overlay border border-border rounded-xl p-4 overflow-x-auto text-text-secondary font-mono whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

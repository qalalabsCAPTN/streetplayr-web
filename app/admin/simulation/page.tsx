'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import { cn } from '@/lib/ops2/cn';
import {
  Activity, CheckCircle2, Coins, FlaskConical, GitBranch,
  ShieldAlert, Sparkles, Wallet, XCircle, Zap,
} from 'lucide-react';

// ============================================================
// Simulation Page — /admin/simulation
// Inline simulation engine: no external package needed.
// ============================================================

type Outcome = 'pass' | 'fail' | 'skip' | 'info';

interface SimSpan {
  step: string;
  description: string;
  outcome: Outcome;
  value: unknown;
  durationMs: number;
}

interface SimResult {
  input: SimInput;
  summary: {
    pointsGranted: number;
    xpGranted: number;
    rulesMatched: number;
    rulesExecuted: number;
    validationPassed: boolean;
  };
  estimatedWalletBalanceAfter: number;
  spans: SimSpan[];
  wouldTriggerAchievements: string[];
  wouldTriggerNotifications: string[];
}

interface SimInput {
  platform: string;
  eventType: string;
  userId: string;
  payload: Record<string, unknown>;
  currentTier: string;
  currentBalance: number;
}

interface Scenario {
  id: string;
  label: string;
  description: string;
  input: SimInput;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'purchase-standard',
    label: 'Standard Purchase',
    description: 'Customer completes a ₹1,500 order — Bloom tier.',
    input: {
      platform: 'streetplayr',
      eventType: 'purchase.completed',
      userId: 'usr_demo_001',
      payload: { orderTotal: 1500, orderId: 'ord_xxx', currency: 'INR' },
      currentTier: 'bloom',
      currentBalance: 3200,
    },
  },
  {
    id: 'purchase-first-order',
    label: 'First Order Bonus',
    description: 'New user makes their first-ever purchase.',
    input: {
      platform: 'streetplayr',
      eventType: 'purchase.first_order',
      userId: 'usr_demo_002',
      payload: { orderTotal: 999, orderId: 'ord_yyy', currency: 'INR' },
      currentTier: 'seed',
      currentBalance: 0,
    },
  },
  {
    id: 'referral-converted',
    label: 'Referral Conversion',
    description: 'Referred user completes signup + first purchase.',
    input: {
      platform: 'streetplayr',
      eventType: 'referral.converted',
      userId: 'usr_demo_003',
      payload: { referrerId: 'usr_demo_001', attributedOrderId: 'ord_zzz' },
      currentTier: 'seed',
      currentBalance: 0,
    },
  },
  {
    id: 'streak-maintained',
    label: 'Streak Bonus',
    description: 'User maintains a 7-day login streak.',
    input: {
      platform: 'streetplayr',
      eventType: 'streak.maintained',
      userId: 'usr_demo_004',
      payload: { streakDays: 7 },
      currentTier: 'sprout',
      currentBalance: 800,
    },
  },
];

const TIER_MULTIPLIERS: Record<string, number> = {
  seed: 1.0, sprout: 1.25, bloom: 1.5, nectar: 2.0, apex: 3.0,
};

const EARN_RATE = 1.0; // points per ₹

function runSimulation(input: SimInput): SimResult {
  const spans: SimSpan[] = [];
  let pointsGranted = 0;
  let xpGranted = 0;
  let rulesMatched = 0;
  let rulesExecuted = 0;
  let validationPassed = true;
  const achievements: string[] = [];
  const notifications: string[] = [];

  // Step 1: Event ingestion
  spans.push({
    step: 'event.ingest',
    description: `Event received: ${input.eventType} from platform ${input.platform}`,
    outcome: 'pass',
    value: { eventType: input.eventType, platform: input.platform, userId: input.userId },
    durationMs: Math.floor(Math.random() * 3) + 1,
  });

  // Step 2: User lookup
  spans.push({
    step: 'user.lookup',
    description: `Profile loaded — Tier: ${input.currentTier}, Balance: ${input.currentBalance} pts`,
    outcome: 'pass',
    value: { tier: input.currentTier, balance: input.currentBalance },
    durationMs: Math.floor(Math.random() * 5) + 2,
  });

  // Step 3: Validation
  const isValidEvent = ['purchase.completed', 'purchase.first_order', 'referral.converted',
    'streak.maintained', 'achievement.unlocked', 'quest.completed'].includes(input.eventType);

  spans.push({
    step: 'validation.check',
    description: isValidEvent ? 'Event type is eligible for rewards' : 'Event type not in reward eligibility list',
    outcome: isValidEvent ? 'pass' : 'fail',
    value: { eligible: isValidEvent },
    durationMs: Math.floor(Math.random() * 2) + 1,
  });

  if (!isValidEvent) {
    validationPassed = false;
    return {
      input, spans,
      summary: { pointsGranted: 0, xpGranted: 0, rulesMatched: 0, rulesExecuted: 0, validationPassed: false },
      estimatedWalletBalanceAfter: input.currentBalance,
      wouldTriggerAchievements: [],
      wouldTriggerNotifications: [],
    };
  }

  // Step 4: Rule matching
  const mult = TIER_MULTIPLIERS[input.currentTier] ?? 1.0;

  if (input.eventType === 'purchase.completed' || input.eventType === 'purchase.first_order') {
    rulesMatched++;
    const orderTotal = (input.payload.orderTotal as number) ?? 0;
    const base = Math.floor(orderTotal * EARN_RATE);
    const earned = Math.floor(base * mult);
    const xp = Math.floor(earned * 0.5);

    spans.push({
      step: 'rule.purchase_reward',
      description: `Purchase reward: ₹${orderTotal} × ${EARN_RATE} pts/₹ × ${mult}x tier multiplier`,
      outcome: 'pass',
      value: { basePoints: base, multiplier: mult, finalPoints: earned },
      durationMs: Math.floor(Math.random() * 4) + 2,
    });
    pointsGranted += earned;
    xpGranted += xp;
    rulesExecuted++;

    if (input.eventType === 'purchase.first_order') {
      rulesMatched++;
      const bonus = 500;
      spans.push({
        step: 'rule.first_order_bonus',
        description: `First order bonus: +${bonus} pts flat reward`,
        outcome: 'pass',
        value: { bonus },
        durationMs: Math.floor(Math.random() * 3) + 1,
      });
      pointsGranted += bonus;
      xpGranted += 250;
      rulesExecuted++;
      achievements.push('First Purchase Achievement');
      notifications.push('Welcome to the PlayR ecosystem!');
    }
  }

  if (input.eventType === 'referral.converted') {
    rulesMatched++;
    const bonus = 750;
    spans.push({
      step: 'rule.referral_bonus',
      description: `Referral conversion: +${bonus} pts to referrer, +250 pts to new user`,
      outcome: 'pass',
      value: { referrerBonus: bonus, newUserBonus: 250 },
      durationMs: Math.floor(Math.random() * 5) + 3,
    });
    pointsGranted += 250;
    xpGranted += 150;
    rulesExecuted++;
    achievements.push('First Referral Achievement');
  }

  if (input.eventType === 'streak.maintained') {
    rulesMatched++;
    const days = (input.payload.streakDays as number) ?? 1;
    const bonus = days >= 7 ? 200 : days >= 3 ? 75 : 25;
    spans.push({
      step: 'rule.streak_bonus',
      description: `${days}-day streak bonus: +${bonus} pts`,
      outcome: 'pass',
      value: { streakDays: days, bonus },
      durationMs: Math.floor(Math.random() * 3) + 1,
    });
    pointsGranted += bonus;
    xpGranted += Math.floor(bonus * 0.3);
    rulesExecuted++;
    if (days >= 7) achievements.push('7-Day Streak Achievement');
  }

  // Step 5: Ledger write
  spans.push({
    step: 'wallet.ledger_write',
    description: `Wallet debit/credit — +${pointsGranted} pts, new balance: ${input.currentBalance + pointsGranted}`,
    outcome: 'pass',
    value: {
      type: 'credit',
      amount: pointsGranted,
      balanceBefore: input.currentBalance,
      balanceAfter: input.currentBalance + pointsGranted,
    },
    durationMs: Math.floor(Math.random() * 6) + 3,
  });

  // Step 6: Realtime broadcast
  spans.push({
    step: 'realtime.broadcast',
    description: 'Supabase realtime event pushed to connected clients',
    outcome: 'info',
    value: { channel: `user:${input.userId}`, event: 'wallet.updated' },
    durationMs: Math.floor(Math.random() * 8) + 4,
  });

  notifications.push(`You earned ${pointsGranted} NECTAR points!`);
  if (xpGranted > 0) notifications.push(`+${xpGranted} XP added to your progression`);

  return {
    input,
    summary: { pointsGranted, xpGranted, rulesMatched, rulesExecuted, validationPassed },
    estimatedWalletBalanceAfter: input.currentBalance + pointsGranted,
    spans,
    wouldTriggerAchievements: achievements,
    wouldTriggerNotifications: notifications,
  };
}

// ── Component ─────────────────────────────────────────────────

const OUTCOME_CLASS: Record<Outcome, string> = {
  pass: 'text-status-success bg-status-success/10 border-status-success/20',
  fail: 'text-status-error bg-status-error/10 border-status-error/20',
  skip: 'text-text-muted bg-base-overlay border-border',
  info: 'text-status-info bg-status-info/10 border-status-info/20',
};

export default function SimulationPage() {
  const [activeId, setActiveId] = useState(SCENARIOS[0]!.id);
  const activeScenario = SCENARIOS.find(s => s.id === activeId) ?? SCENARIOS[0]!;
  const result = useMemo(() => runSimulation(activeScenario.input), [activeScenario]);

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Simulation" />
      <div className="flex-1 overflow-y-auto pt-14">
        <div className="space-y-6 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nectar-400/20 bg-nectar-400/10">
                <FlaskConical className="h-5 w-5 text-nectar-400" />
              </div>
              <div>
                <h2 className="page-title">Operational Simulation Center</h2>
                <p className="mt-0.5 text-sm text-text-muted">
                  Preview events, validation, ledger deltas, progression outcomes, and realtime broadcasts
                </p>
              </div>
            </div>
          </div>

          {/* Scenario picker */}
          <div className="grid grid-cols-4 gap-4">
            {SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => setActiveId(scenario.id)}
                className={cn(
                  'surface p-4 text-left transition-colors',
                  activeId === scenario.id && 'border-nectar-400/40 bg-nectar-400/5'
                )}
              >
                <div className="text-sm font-semibold text-text-primary">{scenario.label}</div>
                <div className="mt-1 text-xs text-text-muted">{scenario.description}</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded border border-border px-2 py-0.5 text-[10px] text-text-muted">
                    {scenario.input.platform}
                  </span>
                  <span className="font-mono text-[10px] text-nectar-400">{scenario.input.eventType}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-5 gap-4">
            <Metric icon={<Coins className="h-4 w-4" />}     label="Points Granted"   value={result.summary.pointsGranted.toLocaleString()} tone="nectar" />
            <Metric icon={<Sparkles className="h-4 w-4" />}  label="XP Granted"       value={result.summary.xpGranted.toLocaleString()}     tone="success" />
            <Metric icon={<GitBranch className="h-4 w-4" />} label="Rules Executed"   value={`${result.summary.rulesExecuted}/${result.summary.rulesMatched}`} tone="info" />
            <Metric icon={<Wallet className="h-4 w-4" />}    label="Wallet After"     value={result.estimatedWalletBalanceAfter.toLocaleString()} tone="nectar" />
            <Metric icon={<ShieldAlert className="h-4 w-4" />} label="Validation"     value={result.summary.validationPassed ? 'Passed' : 'Blocked'} tone={result.summary.validationPassed ? 'success' : 'error'} />
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Execution trace */}
            <div className="col-span-2 surface overflow-hidden">
              <div className="border-b border-border px-5 py-3">
                <div className="section-title">Execution Trace</div>
              </div>
              <div className="divide-y divide-border-subtle">
                {result.spans.map(span => (
                  <div key={span.step} className="flex items-start gap-4 px-5 py-4">
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', OUTCOME_CLASS[span.outcome])}>
                      {span.outcome === 'fail' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-nectar-400">{span.step}</div>
                      <div className="mt-1 text-sm text-text-primary">{span.description}</div>
                      <pre className="mt-2 overflow-auto rounded-lg bg-base-overlay p-2 text-[11px] leading-5 text-text-muted">
                        {JSON.stringify(span.value, null, 2)}
                      </pre>
                    </div>
                    <div className="font-mono text-xs text-text-muted shrink-0">{span.durationMs}ms</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side panels */}
            <div className="space-y-5">
              <div className="surface p-5">
                <div className="section-title mb-4">Outcome Cascades</div>
                <div className="space-y-3">
                  <OutcomeList title="Achievements" items={result.wouldTriggerAchievements} />
                  <OutcomeList title="Notifications" items={result.wouldTriggerNotifications} />
                </div>
              </div>
              <div className="surface p-5">
                <div className="section-title mb-4">Event Payload</div>
                <pre className="max-h-80 overflow-auto rounded-lg bg-base-overlay p-3 text-xs leading-5 text-text-secondary">
                  {JSON.stringify(result.input, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: {
  icon: ReactNode; label: string; value: string;
  tone: 'nectar' | 'success' | 'info' | 'error';
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <div className="metric-label">{label}</div>
        <div className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg',
          tone === 'nectar'  ? 'bg-nectar-400/10 text-nectar-400' :
          tone === 'success' ? 'bg-status-success/10 text-status-success' :
          tone === 'error'   ? 'bg-status-error/10 text-status-error' :
                               'bg-status-info/10 text-status-info'
        )}>
          {icon}
        </div>
      </div>
      <div className="metric-value text-text-primary">{value}</div>
    </div>
  );
}

function OutcomeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <Activity className="h-3 w-3" />
        {title}
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-base-overlay px-3 py-2 text-xs text-text-muted">
          No cascade for this simulation
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(item => (
            <div key={item} className="rounded-lg border border-nectar-400/20 bg-nectar-400/10 px-3 py-2 text-xs font-medium text-nectar-300">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

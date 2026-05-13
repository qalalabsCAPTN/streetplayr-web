'use client';

import { useState } from 'react';
import { Wallet, ArrowUpRight, Zap, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { DEMO_WALLET, DEMO_RECENT_TRANSACTIONS, PLATFORM_CONFIG } from '@/lib/nectar-portal/demo';

function fmt(n: number) {
  return n.toLocaleString();
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

const EARNED_HISTORY = [
  { month: 'May 2026',   earned: 11240, redeemed: 0 },
  { month: 'Apr 2026',   earned: 18420, redeemed: 8000 },
  { month: 'Mar 2026',   earned: 14800, redeemed: 12000 },
  { month: 'Feb 2026',   earned: 9200,  redeemed: 4000 },
  { month: 'Jan 2026',   earned: 12680, redeemed: 6000 },
  { month: 'Dec 2025',   earned: 23000, redeemed: 34590 },
];

const maxEarned = Math.max(...EARNED_HISTORY.map(h => h.earned));

export default function WalletPage() {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const txs = filter === 'all' ? DEMO_RECENT_TRANSACTIONS : DEMO_RECENT_TRANSACTIONS.filter(t => t.type === filter);

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Hero wallet card */}
      <div className="relative overflow-hidden rounded-3xl p-8 animate-fade-up"
        style={{ background: 'linear-gradient(135deg, #FBBF2420 0%, #F97316 10%, #0f0f0f 40%)', border: '1px solid rgba(251,191,36,0.20)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(251,191,36,0.12) 0%, transparent 60%)' }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-nectar-400" />
              <span className="text-sm font-semibold text-text-muted uppercase tracking-wider">NECTAR Wallet</span>
            </div>
            <div className="text-6xl font-black text-text-primary tabular-nums mb-2">
              {fmt(DEMO_WALLET.nectarPoints)}
            </div>
            <div className="text-lg text-text-muted font-medium">NECTAR Points</div>
            {DEMO_WALLET.pendingPoints > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-status-success/10 border border-status-success/20 px-3 py-1.5 text-sm font-semibold text-status-success">
                <Zap className="h-3.5 w-3.5" />
                +{fmt(DEMO_WALLET.pendingPoints)} pending settlement
              </div>
            )}
          </div>
          <div className="text-right space-y-4">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Lifetime Earned</div>
              <div className="text-2xl font-bold text-text-primary">{fmt(DEMO_WALLET.lifetimeEarned)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Lifetime Redeemed</div>
              <div className="text-2xl font-bold text-text-muted">{fmt(DEMO_WALLET.lifetimeRedeemed)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Earned history chart */}
        <div className="col-span-1 card p-5">
          <h2 className="text-sm font-bold text-text-primary mb-5">Monthly Earnings</h2>
          <div className="space-y-3">
            {EARNED_HISTORY.map(h => (
              <div key={h.month}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">{h.month}</span>
                  <span className="font-semibold text-text-primary">{fmt(h.earned)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-base-overlay overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(h.earned / maxEarned) * 100}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary">Transaction History</h2>
            <div className="flex gap-1">
              {(['all', 'credit', 'debit'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                    filter === f ? 'bg-nectar-400/20 text-nectar-300' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {txs.map(tx => {
              const platCfg = PLATFORM_CONFIG[tx.platform as keyof typeof PLATFORM_CONFIG];
              return (
                <div key={tx.id} className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-base-elevated transition-colors">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${platCfg?.color}15`, color: platCfg?.color }}>
                    {tx.type === 'credit'
                      ? <ArrowUpRight className="h-4 w-4" />
                      : <ArrowUpRight className="h-4 w-4 rotate-180" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary">{tx.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold" style={{ color: platCfg?.color }}>{platCfg?.name}</span>
                      <span className="text-[10px] text-text-muted">·</span>
                      <span className="text-[10px] text-text-muted">{relTime(tx.at)}</span>
                    </div>
                  </div>
                  <div className={cn('text-base font-bold tabular-nums shrink-0', tx.type === 'credit' ? 'text-status-success' : 'text-status-error')}>
                    {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

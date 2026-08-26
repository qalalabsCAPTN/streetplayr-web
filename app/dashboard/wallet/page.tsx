import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Wallet, ArrowUpRight, ArrowDownLeft, Zap } from 'lucide-react';
import {
  getWalletBalance,
  getWalletTransactions,
  getMonthlyEarnings,
} from '@/lib/nectar/wallet';

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

const SOURCE_LABELS: Record<string, string> = {
  earned: 'Purchase Reward',
  referral_bonus: 'Referral Bonus',
  adjustment: 'Admin Adjustment',
  redemption: 'Reward Redeemed',
  welcome_bonus: 'Welcome Bonus',
  purchase: 'Purchase Reward',
};

const SOURCE_COLORS: Record<string, string> = {
  earned: '#FBBF24',
  referral_bonus: '#60A5FA',
  adjustment: '#A78BFA',
  redemption: '#F87171',
  welcome_bonus: '#34D399',
  purchase: '#FBBF24',
};

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [wallet, transactions, monthlyEarnings] = await Promise.all([
    getWalletBalance(user.id),
    getWalletTransactions(user.id),
    getMonthlyEarnings(user.id),
  ]);

  const maxEarned = Math.max(...monthlyEarnings.map(h => h.earned), 1);

  // Group transactions by filter tabs
  const credits = transactions.filter(t => t.delta > 0);
  const debits = transactions.filter(t => t.delta < 0);

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Hero wallet card */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 animate-fade-up"
        style={{
          background: 'linear-gradient(135deg, #FBBF2420 0%, #F97316 10%, #0f0f0f 40%)',
          border: '1px solid rgba(251,191,36,0.20)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(251,191,36,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-nectar-400" />
              <span className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                StreetPlayR wallet
              </span>
            </div>
            <div className="text-6xl font-black text-text-primary tabular-nums mb-2">
              {fmt(wallet.sprrBalance)}
            </div>
            <div className="text-lg text-text-muted font-medium">SP-RR Points</div>
            {wallet.pendingPoints > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-status-success/10 border border-status-success/20 px-3 py-1.5 text-sm font-semibold text-status-success">
                <Zap className="h-3.5 w-3.5" />
                +{fmt(wallet.pendingPoints)} pending settlement
              </div>
            )}
          </div>
          <div className="text-right space-y-4">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Lifetime Earned</div>
              <div className="text-2xl font-bold text-text-primary">{fmt(wallet.lifetimeEarned)}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider">Lifetime Redeemed</div>
              <div className="text-2xl font-bold text-text-muted">{fmt(wallet.lifetimeRedeemed)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Monthly earnings chart */}
        <div className="col-span-1 card p-5">
          <h2 className="text-sm font-bold text-text-primary mb-5">Monthly Earnings</h2>
          {monthlyEarnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Zap className="h-6 w-6 text-text-muted opacity-30 mb-2" />
              <p className="text-xs text-text-muted">No activity yet</p>
              <p className="text-[10px] text-text-muted mt-1">Earn SP-RR by shopping</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyEarnings.map(h => (
                <div key={h.month}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">{h.month}</span>
                    <span className="font-semibold text-text-primary">{fmt(h.earned)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-base-overlay overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(h.earned / maxEarned) * 100}%`,
                        background: 'linear-gradient(90deg, #F97316, #FBBF24)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction history */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary">Transaction History</h2>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              {transactions.length} transactions
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Wallet className="h-8 w-8 text-text-muted opacity-20 mb-3" />
              <p className="text-sm text-text-muted">No transactions yet</p>
              <p className="text-xs text-text-muted mt-1 opacity-60">
                Complete a purchase to earn your first SP-RR
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {transactions.map(tx => {
                const isCredit = tx.delta > 0;
                const color = SOURCE_COLORS[tx.source] ?? (isCredit ? '#FBBF24' : '#F87171');
                const label = SOURCE_LABELS[tx.source] ?? tx.description ?? tx.source;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 rounded-xl px-4 py-3 hover:bg-base-elevated transition-colors"
                  >
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}15`, color }}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate">{label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color }}
                        >
                          {tx.source.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-text-muted">·</span>
                        <span className="text-[10px] text-text-muted">{relTime(tx.createdAt)}</span>
                      </div>
                    </div>
                    <div
                      className={`text-base font-bold tabular-nums shrink-0 ${
                        isCredit ? 'text-status-success' : 'text-status-error'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{fmt(Math.abs(tx.delta))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* XP indicator */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Experience Points</div>
          <div className="text-2xl font-bold text-text-primary tabular-nums">{fmt(wallet.xp)} XP</div>
        </div>
        <a
          href="/profile/rewards"
          className="text-xs font-semibold text-nectar-400 hover:text-nectar-300 transition-colors uppercase tracking-wider"
        >
          View Rewards Center →
        </a>
      </div>
    </div>
  );
}

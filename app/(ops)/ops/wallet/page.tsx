import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";

interface WalletTx {
  id: string;
  type: "earned" | "spent";
  amount: number;
  description: string;
  timestamp: string;
  balance: number;
  source: string;
}

interface WalletSummary {
  totalIssued: number;
  totalRedeemed: number;
  activeUsers: number;
}

function formatTime(ts: string) {
  if (!ts) return "—";
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " today";
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

async function getWalletData(): Promise<{ transactions: WalletTx[]; summary: WalletSummary }> {
  try {
    const admin = createAdminClient();

    const { data: txns } = await admin
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: profiles } = await admin
      .from("profiles")
      .select("sprr_balance");

    const transactions: WalletTx[] = (txns ?? []).map((t: any) => {
      const isEarned = t.delta > 0;
      return {
        id: t.id,
        type: isEarned ? "earned" : "spent",
        amount: Math.abs(t.delta),
        description: t.source || t.type || "Transaction",
        timestamp: t.created_at,
        balance: 0,
        source: t.source,
      };
    });

    let runningBalance = transactions.reduce((s, t) => s + (t.type === "earned" ? t.amount : -t.amount), 0);
    const withBalances = transactions.map((t) => {
      const b = runningBalance;
      runningBalance = t.type === "earned" ? runningBalance - t.amount : runningBalance + t.amount;
      return { ...t, balance: b };
    }).reverse();

    const activeBalances = (profiles ?? []).map((p: any) => p.sprr_balance ?? 0);
    const totalIssued = activeBalances.reduce((s: number, b: number) => s + Math.max(0, b), 0);
    const totalRedeemed = withBalances.filter((t) => t.type === "spent").reduce((s, t) => s + t.amount, 0);
    const activeUsers = activeBalances.filter((b: number) => b > 0).length;

    return {
      transactions: withBalances.reverse(),
      summary: {
        totalIssued: Math.max(totalIssued, totalRedeemed),
        totalRedeemed,
        activeUsers: activeUsers || (profiles?.length ?? 0),
      },
    };
  } catch {
    return { transactions: [], summary: { totalIssued: 0, totalRedeemed: 0, activeUsers: 0 } };
  }
}

export default async function WalletPage() {
  const { transactions, summary } = await getWalletData();
  const burnRate = summary.totalIssued > 0
    ? ((summary.totalRedeemed / summary.totalIssued) * 100).toFixed(1) + "%"
    : "0%";
  const netCirculation = summary.totalIssued - summary.totalRedeemed;
  const avgWallet = summary.activeUsers > 0 ? Math.round(netCirculation / summary.activeUsers) : 0;

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Wallet Progression
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Incentive Authority / {summary.activeUsers} Active Wallets
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{summary.totalIssued.toLocaleString()} SP</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Issued</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-red-400/70">{summary.totalRedeemed.toLocaleString()} SP</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Redeemed</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Net Circulation</div>
          <div className="text-4xl font-display text-white">
            {netCirculation.toLocaleString()}
            <span className="text-lg font-mono text-[var(--ops-text-secondary)] ml-2">SP</span>
          </div>
        </div>
        <div className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Burn Rate</div>
          <div className="text-4xl font-display text-white">{burnRate}</div>
          <div className="mt-4 h-[2px] w-full bg-[var(--ops-border-subtle)] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--sp-accent)] transition-all duration-1000"
              style={{ width: burnRate }}
            />
          </div>
        </div>
        <div className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Average Wallet</div>
          <div className="text-4xl font-display text-white">
            {avgWallet.toLocaleString()}
            <span className="text-lg font-mono text-[var(--ops-text-secondary)] ml-2">SP</span>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">
            Transaction Timeline
          </h2>
          <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
            {transactions.length} Events
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-[3px] before:top-3 before:bottom-3 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
            {transactions.map((tx) => (
              <div key={tx.id} className="relative group">
                <div className={`absolute -left-[27px] top-2 w-[7px] h-[7px] rounded-full border border-[var(--ops-bg-base)] ${
                  tx.type === "earned" ? "bg-[var(--sp-accent)]" : "bg-red-400/60"
                }`} />
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-mono uppercase tracking-widest ${
                        tx.type === "earned" ? "text-[var(--sp-accent)]" : "text-red-400/70"
                      }`}>
                        {tx.type === "earned" ? "Earned" : "Spent"}
                      </span>
                      <span className="text-[8px] font-mono text-[var(--ops-text-muted)]">{formatTime(tx.timestamp)}</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--ops-text-secondary)] leading-relaxed">
                      {tx.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-mono ${
                      tx.type === "earned" ? "text-[var(--sp-accent)]" : "text-red-400/70"
                    }`}>
                      {tx.type === "earned" ? "+" : "-"}{tx.amount.toLocaleString()}
                    </div>
                    <div className="text-[8px] font-mono text-[var(--ops-text-muted)]">{tx.balance.toLocaleString()} SP</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[20vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
            <div className="text-center">
              <p className="font-mono text-[11px] text-[var(--ops-text-muted)] uppercase tracking-[0.2em]">
                No wallet activity yet
              </p>
              <p className="mt-2 font-mono text-[10px] text-[var(--ops-text-muted)]">
                Rewards and transactions will appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Wallet Engine</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Incentive Logic / Points Ledger</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Next Milestone</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Seasonal Bonus — Lookbook 04</div>
        </div>
      </section>
    </div>
  );
}

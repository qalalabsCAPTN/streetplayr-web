import React from "react";

const TRANSACTIONS = [
  {
    id: "tx_001",
    type: "earned",
    amount: 480,
    description: "Genesis Archive Hoodie purchase — Tier 1 bonus",
    timestamp: "10:04 AM today",
    balance: 480,
  },
  {
    id: "tx_002",
    type: "spent",
    amount: -200,
    description: "Early Access redemption — Lookbook 04 preview",
    timestamp: "09:42 AM today",
    balance: 280,
  },
  {
    id: "tx_003",
    type: "earned",
    amount: 800,
    description: "Wallet top-up — membership milestone reward",
    timestamp: "2026-05-06",
    balance: 1080,
  },
  {
    id: "tx_004",
    type: "earned",
    amount: 150,
    description: "Referral bonus — referred Priya Sharma",
    timestamp: "2026-05-04",
    balance: 1230,
  },
  {
    id: "tx_005",
    type: "spent",
    amount: -350,
    description: "PlayR Utility Cargo exclusive reservation lock",
    timestamp: "2026-05-02",
    balance: 880,
  },
  {
    id: "tx_006",
    type: "earned",
    amount: 220,
    description: "Noir Technical Shell pre-order points",
    timestamp: "2026-04-28",
    balance: 1100,
  },
];

const WALLET_SUMMARY = {
  totalIssued: 24800,
  totalRedeemed: 12400,
  activeUsers: 156,
  burnRate: "47.2%",
};

export default function WalletPage() {
  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            Wallet Progression
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Incentive Authority / {WALLET_SUMMARY.activeUsers} Active Wallets
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{WALLET_SUMMARY.totalIssued.toLocaleString()} SP</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Issued</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-red-400/70">{WALLET_SUMMARY.totalRedeemed.toLocaleString()} SP</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Redeemed</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Net Circulation</div>
          <div className="text-4xl font-display text-white">
            {(WALLET_SUMMARY.totalIssued - WALLET_SUMMARY.totalRedeemed).toLocaleString()}
            <span className="text-lg font-mono text-[var(--ops-text-secondary)] ml-2">SP</span>
          </div>
        </div>
        <div className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Burn Rate</div>
          <div className="text-4xl font-display text-white">
            {WALLET_SUMMARY.burnRate}
          </div>
          <div className="mt-4 h-[2px] w-full bg-[var(--ops-border-subtle)] relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-[var(--sp-accent)] w-[47.2%]" />
          </div>
        </div>
        <div className="p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Average Wallet</div>
          <div className="text-4xl font-display text-white">
            {Math.round((WALLET_SUMMARY.totalIssued - WALLET_SUMMARY.totalRedeemed) / WALLET_SUMMARY.activeUsers).toLocaleString()}
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
            {TRANSACTIONS.length} Events
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-[3px] before:top-3 before:bottom-3 before:w-[1px] before:bg-[var(--ops-border-subtle)]">
          {TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="relative group">
              <div className={`absolute -left-[27px] top-2 w-[7px] h-[7px] rounded-full border border-[var(--ops-bg-base)] ${
                tx.type === 'earned' ? 'bg-[var(--sp-accent)]' : 'bg-red-400/60'
              }`} />
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[9px] font-mono uppercase tracking-widest ${
                      tx.type === 'earned' ? 'text-[var(--sp-accent)]' : 'text-red-400/70'
                    }`}>
                      {tx.type === 'earned' ? 'Earned' : 'Spent'}
                    </span>
                    <span className="text-[8px] font-mono text-[var(--ops-text-muted)]">{tx.timestamp}</span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--ops-text-secondary)] leading-relaxed">
                    {tx.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-mono ${
                    tx.amount > 0 ? 'text-[var(--sp-accent)]' : 'text-red-400/70'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-[8px] font-mono text-[var(--ops-text-muted)]">{tx.balance.toLocaleString()} SP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Wallet Engine</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Incentive Logic / Points Ledger</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Next Milestone</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Seasonal Bonus — 15% on Lookbook 04</div>
        </div>
      </section>
    </div>
  );
}

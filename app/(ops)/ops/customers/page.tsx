import React from "react";

const CUSTOMERS = [
  {
    id: "usr_001",
    name: "Arjun Mehta",
    email: "arjun.m@example.com",
    tier: "Genesis",
    totalSpent: 4860,
    orderCount: 12,
    walletBalance: 2400,
    lastActivity: "10:04 AM today",
    avatar: "AM",
  },
  {
    id: "usr_002",
    name: "Priya Sharma",
    email: "priya.s@example.com",
    tier: "Tier 1",
    totalSpent: 2200,
    orderCount: 5,
    walletBalance: 800,
    lastActivity: "08:15 AM today",
    avatar: "PS",
  },
  {
    id: "usr_003",
    name: "Rohan Patel",
    email: "rohan.p@example.com",
    tier: "Member",
    totalSpent: 850,
    orderCount: 2,
    walletBalance: 150,
    lastActivity: "2026-05-05",
    avatar: "RP",
  },
  {
    id: "usr_004",
    name: "Ananya Gupta",
    email: "ananya.g@example.com",
    tier: "Tier 1",
    totalSpent: 1950,
    orderCount: 4,
    walletBalance: 1200,
    lastActivity: "10:22 AM today",
    avatar: "AG",
  },
  {
    id: "usr_005",
    name: "Vikram Singh",
    email: "vikram.s@example.com",
    tier: "Genesis",
    totalSpent: 7200,
    orderCount: 18,
    walletBalance: 5600,
    lastActivity: "09:15 AM today",
    avatar: "VS",
  },
  {
    id: "usr_006",
    name: "Neha Kapoor",
    email: "neha.k@example.com",
    tier: "Member",
    totalSpent: 275,
    orderCount: 1,
    walletBalance: 0,
    lastActivity: "10:30 AM today",
    avatar: "NK",
  },
];

const TIER_STYLES: Record<string, string> = {
  Genesis: "text-[var(--sp-accent)] border-[var(--sp-accent)]/30",
  "Tier 1": "text-blue-400 border-blue-400/30",
  Member: "text-[var(--ops-text-muted)] border-[var(--ops-border-subtle)]",
};

export default function CustomersPage() {
  const totalRevenue = CUSTOMERS.reduce((s, c) => s + c.totalSpent, 0);
  const genesisCount = CUSTOMERS.filter((c) => c.tier === "Genesis").length;

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            CRM Profiles
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Customer Lifecycle Authority / {CUSTOMERS.length} Active Profiles
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{genesisCount}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Genesis Members</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-white">${totalRevenue.toLocaleString()}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Lifetime Value</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CUSTOMERS.map((customer) => (
          <div
            key={customer.id}
            className="group p-8 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20 hover:bg-[var(--ops-bg-surface)]/40 transition-all duration-500"
          >
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-full border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-mono text-[var(--ops-text-secondary)]">{customer.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-display uppercase tracking-tight text-white truncate group-hover:pl-2 transition-all duration-500">
                    {customer.name}
                  </h3>
                  <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border ${TIER_STYLES[customer.tier]}`}>
                    {customer.tier}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[var(--ops-text-secondary)] mb-4">{customer.email}</p>
                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[var(--ops-border-subtle)]">
                  <div>
                    <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Orders</div>
                    <div className="text-lg font-mono text-white">{customer.orderCount}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Spent</div>
                    <div className="text-lg font-mono text-white">${customer.totalSpent.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Wallet</div>
                    <div className="text-lg font-mono text-[var(--sp-accent)]">{customer.walletBalance.toLocaleString()} SP</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--ops-border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                    Last Activity: {customer.lastActivity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="pt-12 border-t border-[var(--ops-border-subtle)] flex gap-24">
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Sync Authority</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Supabase Auth / Profiles</div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Last Profile Sync</div>
          <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">Real-time</div>
        </div>
      </section>
    </div>
  );
}

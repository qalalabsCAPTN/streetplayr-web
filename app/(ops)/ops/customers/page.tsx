import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  sprrBalance: number;
  orderCount: number;
  totalSpent: number;
  lastActivity: string;
  joinedAt: string;
}

const ROLE_STYLES: Record<string, string> = {
  super_admin: "text-red-400 border-red-400/30",
  ops_admin: "text-[var(--sp-accent)] border-[var(--sp-accent)]/30",
  fulfillment: "text-blue-400 border-blue-400/30",
  editorial: "text-purple-400 border-purple-400/30",
  support: "text-green-400 border-green-400/30",
  member: "text-[var(--ops-text-muted)] border-[var(--ops-border-subtle)]",
};

async function getCustomers(): Promise<CustomerProfile[]> {
  try {
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, role, sprr_balance, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: orderAgg } = await admin
      .from("orders")
      .select("user_id, total");

    const spentMap: Record<string, number> = {};
    const orderCountMap: Record<string, number> = {};
    for (const o of orderAgg ?? []) {
      spentMap[o.user_id] = (spentMap[o.user_id] ?? 0) + (o.total ?? 0);
      orderCountMap[o.user_id] = (orderCountMap[o.user_id] ?? 0) + 1;
    }

    return (profiles ?? []).map((p: any): CustomerProfile => {
      const initials = (p.full_name || p.email || "U")
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return {
        id: p.id,
        name: p.full_name || "Unknown",
        email: p.email || "—",
        avatar: initials || "U",
        role: p.role || "member",
        sprrBalance: p.sprr_balance ?? 0,
        orderCount: orderCountMap[p.id] ?? 0,
        totalSpent: spentMap[p.id] ?? 0,
        lastActivity: p.updated_at || p.created_at,
        joinedAt: p.created_at,
      };
    });
  } catch {
    return [];
  }
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

export default async function CustomersPage() {
  const customers = await getCustomers();
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const genesisCount = customers.filter((c) => c.role !== "member").length;

  return (
    <div className="space-y-12">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            CRM Profiles
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Customer Lifecycle Authority / {customers.length} Active Profiles
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{genesisCount}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Non-Member</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-white">${totalRevenue.toLocaleString()}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Lifetime Value</div>
          </div>
        </div>
      </section>

      {customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customers.map((customer) => (
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
                    <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest border ${ROLE_STYLES[customer.role] || ROLE_STYLES["member"]}`}>
                      {customer.role}
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
                      <div className="text-lg font-mono text-[var(--sp-accent)]">{customer.sprrBalance.toLocaleString()} SP</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--ops-border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                      Last Activity: {formatTime(customer.lastActivity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[40vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
          <div className="text-center">
            <p className="font-mono text-[11px] text-[var(--ops-text-muted)] uppercase tracking-[0.2em]">
              No customer profiles found
            </p>
            <p className="mt-2 font-mono text-[10px] text-[var(--ops-text-muted)]">
              User profiles sync from Supabase Auth automatically.
            </p>
          </div>
        </div>
      )}

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

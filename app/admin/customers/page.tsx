'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge, TierBadge, PlatformBadge } from '@/components/ops2/ui/badge';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import { formatRelativeTime, formatCurrency, formatPoints } from '@/lib/ops2/format';
import { usePlatform } from '@/hooks/ops2/use-platform';
import type { CustomerOverview } from '@/types/ops2/ops';
import { deriveTier } from '@/store/authStore';

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  sprr_balance: number | null;
  lifetime_xp: number | null;
  last_active_at: string | null;
  created_at: string;
}

async function resolveSiteId(apiParam?: string) {
  if (!apiParam) return undefined;

  const db = getSupabaseClient();
  const { data } = await db.from('sites').select('id').eq('slug', apiParam).single();
  return (data as { id: string } | null)?.id;
}

async function fetchCustomers(apiParam?: string, search?: string) {
  const db = getSupabaseClient();
  const siteId = await resolveSiteId(apiParam);

  let ordersQuery = db.from('orders').select('id, user_id, total, site_id').order('created_at', { ascending: false }).limit(500);
  let txQuery = db.from('wallet_transactions').select('user_id, site_id').order('created_at', { ascending: false }).limit(1000);

  if (siteId) {
    ordersQuery = ordersQuery.eq('site_id', siteId);
    txQuery = txQuery.eq('site_id', siteId);
  }

  const [{ data: siteRows }, { data: orders }, { data: walletTx }] = await Promise.all([
    db.from('sites').select('id, slug'),
    ordersQuery,
    txQuery,
  ]);

  const siteList = (siteRows ?? []) as Array<{ id: string; slug: string }>;
  const orderRows = (orders ?? []) as Array<{ user_id: string; total: number; site_id?: string | null }>;
  const txRows = (walletTx ?? []) as Array<{ user_id: string; site_id?: string | null }>;

  const relevantUserIds = new Set<string>();
  const spendByUser: Record<string, number> = {};
  const orderCountByUser: Record<string, number> = {};
  const platformByUser: Record<string, Set<string>> = {};
  const slugBySiteId = new Map(siteList.map((row) => [row.id, row.slug]));

  for (const order of orderRows) {
    relevantUserIds.add(order.user_id);
    spendByUser[order.user_id] = (spendByUser[order.user_id] ?? 0) + (order.total ?? 0);
    orderCountByUser[order.user_id] = (orderCountByUser[order.user_id] ?? 0) + 1;
    const slug = order.site_id ? slugBySiteId.get(order.site_id) : undefined;
    if (slug) {
      if (!platformByUser[order.user_id]) platformByUser[order.user_id] = new Set<string>();
      platformByUser[order.user_id]!.add(slug);
    }
  }

  for (const tx of txRows) {
    relevantUserIds.add(tx.user_id);
    const slug = tx.site_id ? slugBySiteId.get(tx.site_id) : undefined;
    if (slug) {
      if (!platformByUser[tx.user_id]) platformByUser[tx.user_id] = new Set<string>();
      platformByUser[tx.user_id]!.add(slug);
    }
  }

  let profilesQuery = db
    .from('profiles')
    .select('id, email, full_name, sprr_balance, lifetime_xp, last_active_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (siteId) {
    const userIds = Array.from(relevantUserIds);
    if (userIds.length === 0) {
      return { customers: [] as CustomerOverview[], total: 0 };
    }
    profilesQuery = profilesQuery.in('id', userIds);
  }

  const term = search?.trim();
  if (term) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data: profiles } = await profilesQuery;

  const customers: CustomerOverview[] = (profiles as ProfileRow[] | null ?? []).map((profile) => ({
    userId: profile.id,
    displayName: profile.full_name || 'Unknown',
    email: profile.email || '—',
    status: 'active',
    tier: deriveTier(profile.sprr_balance ?? 0),
    lifetimeXp: profile.lifetime_xp ?? 0,
    pointsBalance: profile.sprr_balance ?? 0,
    totalSpend: spendByUser[profile.id] ?? 0,
    orderCount: orderCountByUser[profile.id] ?? 0,
    referralCount: 0,
    joinedAt: profile.created_at,
    lastActiveAt: profile.last_active_at ?? undefined,
    riskScore: 0,
    connectedPlatforms: apiParam
      ? [apiParam]
      : Array.from(platformByUser[profile.id] ?? []).slice(0, 4),
  }));

  return { customers, total: customers.length };
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { apiParam } = usePlatform();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', apiParam, search],
    queryFn: () => fetchCustomers(apiParam, search || undefined),
    placeholderData: prev => prev,
  });

  const customers = data?.customers ?? [];

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Customers" />

      <div className="flex-1 pt-14 p-5 flex flex-col gap-5 min-h-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="page-title">Customers</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {data?.total ? `${data.total.toLocaleString()} members` : 'Ecosystem members'}
            </p>
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              className="field pl-9"
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="surface flex-1 overflow-hidden flex flex-col">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Tier</th>
                <th>Platforms</th>
                <th>Points</th>
                <th>Lifetime XP</th>
                <th>Total Spend</th>
                <th>Status</th>
                <th>Last Active</th>
              </tr>
            </thead>
          </table>
          <div className="flex-1 overflow-y-auto">
            <table className="data-table">
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><div className="h-4 bg-base-elevated rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="No customers found" description="Try adjusting your search or platform filter." />
                    </td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr
                      key={c.userId}
                      onClick={() => router.push(`/admin/customers/${c.userId}`)}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-base-overlay border border-border flex items-center justify-center text-xs font-medium text-text-secondary shrink-0">
                            {c.displayName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{c.displayName}</div>
                            <div className="text-xs text-text-muted">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><TierBadge tier={c.tier} /></td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {c.connectedPlatforms.slice(0, 2).map(p => <PlatformBadge key={p} platform={p} />)}
                          {c.connectedPlatforms.length > 2 && (
                            <span className="text-xs text-text-muted">+{c.connectedPlatforms.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-nectar-400 font-medium">{formatPoints(c.pointsBalance)}</td>
                      <td className="text-blue-400 font-medium">{c.lifetimeXp.toLocaleString()} XP</td>
                      <td>{formatCurrency(c.totalSpend)}</td>
                      <td>
                        <Badge variant={
                          c.status === 'active'    ? 'success' :
                          c.status === 'flagged'   ? 'warning' :
                          c.status === 'suspended' ? 'error' : 'muted'
                        }>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="text-text-muted">
                        {c.lastActiveAt ? formatRelativeTime(c.lastActiveAt) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge, TierBadge, PlatformBadge } from '@/components/ops2/ui/badge';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import { api } from '@/lib/ops2/api-client';
import { formatRelativeTime, formatCurrency, formatPoints } from '@/lib/ops2/format';
import { cn } from '@/lib/ops2/cn';
import { usePlatform } from '@/hooks/ops2/use-platform';
import type { CustomerOverview } from '@/types/ops2/ops';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { apiParam } = usePlatform();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', apiParam, search],
    queryFn: () => api.get<{ customers: CustomerOverview[]; total: number }>('/customers', {
      platform: apiParam, q: search || undefined, limit: 50,
    }),
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

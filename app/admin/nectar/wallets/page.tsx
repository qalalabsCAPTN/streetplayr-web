'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge } from '@/components/ops2/ui/badge';
import { formatPoints, formatDateTime, formatRelativeTime } from '@/lib/ops2/format';
import { cn } from '@/lib/ops2/cn';
import { usePlatform } from '@/hooks/ops2/use-platform';
import {
  listAdminWalletTransactionsAction,
  type AdminWalletTxRow,
} from '@/app/actions/ops/wallets';

const TX_TYPE_BADGE: Record<
  string,
  { variant: 'success' | 'error' | 'info' | 'warning' | 'muted'; label: string }
> = {
  credit: { variant: 'success', label: 'credit' },
  debit: { variant: 'error', label: 'debit' },
  hold: { variant: 'warning', label: 'hold' },
  release: { variant: 'info', label: 'release' },
  expire: { variant: 'muted', label: 'expire' },
};

export default function WalletsPage() {
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<AdminWalletTxRow | null>(null);
  const { apiParam } = usePlatform();

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-transactions', apiParam, search],
    queryFn: async () => {
      const result = await listAdminWalletTransactionsAction({
        siteSlug: apiParam || undefined,
        search: search || undefined,
        limit: 100,
      });
      return { transactions: result.transactions ?? [] };
    },
    placeholderData: (prev) => prev,
  });

  const txs = data?.transactions ?? [];

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Wallet Management" />

      <div className="flex-1 pt-14 p-5 flex gap-5 min-h-0">
        <div className="flex-1 flex flex-col surface min-w-0">
          <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              Ledger Explorer
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
              <span className="text-xs text-status-success">Append-only — immutable</span>
            </div>
            <div className="flex-1 max-w-sm relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              <input
                className="field pl-8 text-xs"
                placeholder="Search by user ID, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-base-surface z-10">
                <tr>
                  <th>Transaction</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-4 bg-base-elevated rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  txs.map((tx) => {
                    const badge = TX_TYPE_BADGE[tx.type] ?? TX_TYPE_BADGE['credit']!;
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                        className={cn('cursor-pointer', selectedTx?.id === tx.id && 'bg-base-elevated')}
                      >
                        <td>
                          <div className="font-mono text-xs text-text-muted">
                            {tx.id.slice(0, 8)}…
                          </div>
                          <div className="text-xs text-text-secondary truncate max-w-xs">
                            {tx.description}
                          </div>
                        </td>
                        <td>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td>
                          <span className="code text-[10px]">{tx.source}</span>
                        </td>
                        <td>
                          <span
                            className={cn(
                              'font-semibold text-sm',
                              tx.type === 'credit'
                                ? 'text-status-success'
                                : tx.type === 'debit'
                                  ? 'text-status-error'
                                  : 'text-text-secondary'
                            )}
                          >
                            {tx.type === 'credit' ? '+' : tx.type === 'debit' ? '-' : ''}
                            {tx.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="font-mono text-sm text-text-primary">
                          {tx.balance_after.toLocaleString()}
                        </td>
                        <td className="text-text-muted">{formatRelativeTime(tx.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedTx && (
          <div className="w-72 shrink-0 surface flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Transaction</span>
              <button onClick={() => setSelectedTx(null)} className="btn-ghost p-1 text-xs">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[
                { label: 'ID', value: selectedTx.id },
                { label: 'User', value: selectedTx.user_id },
                { label: 'Type', value: selectedTx.type },
                { label: 'Source', value: selectedTx.source },
                { label: 'Amount', value: formatPoints(selectedTx.amount) },
                { label: 'Balance After', value: formatPoints(selectedTx.balance_after) },
                { label: 'Wallet', value: selectedTx.wallet_type },
                { label: 'Time', value: formatDateTime(selectedTx.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-text-muted mb-0.5">{label}</div>
                  <div className="text-sm text-text-primary font-mono break-all">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge } from '@/components/ops2/ui/badge';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import { formatPoints, formatDateTime, formatRelativeTime } from '@/lib/ops2/format';
import { cn } from '@/lib/ops2/cn';
import { usePlatform } from '@/hooks/ops2/use-platform';

interface TxRow {
  id: string;
  user_id: string;
  type: string;
  source: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  wallet_type: string;
}

const TX_TYPE_BADGE: Record<string, { variant: 'success' | 'error' | 'info' | 'warning' | 'muted'; label: string }> = {
  credit:  { variant: 'success', label: 'credit' },
  debit:   { variant: 'error',   label: 'debit' },
  hold:    { variant: 'warning', label: 'hold' },
  release: { variant: 'info',    label: 'release' },
  expire:  { variant: 'muted',   label: 'expire' },
};

export default function WalletsPage() {
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null);
  const { apiParam } = usePlatform();

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-transactions', apiParam, search],
    queryFn: async () => {
      const db = getSupabaseClient();
      let siteId: string | undefined;

      if (apiParam) {
        const { data: site } = await db.from('sites').select('id').eq('slug', apiParam).single();
        siteId = (site as { id: string } | null)?.id;
        if (!siteId) return { transactions: [] as TxRow[] };
      }

      let query = db
        .from('wallet_transactions')
        .select('id, user_id, type, source, delta, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (siteId) query = query.eq('site_id', siteId);
      if (search.trim()) query = query.or(`user_id.ilike.%${search.trim()}%,source.ilike.%${search.trim()}%`);

      const { data: rows } = await query;
      const txRows = (rows ?? []) as Array<{ id: string; user_id: string; type: string; source: string; delta: number; created_at: string }>;

      const transactions: TxRow[] = txRows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        source: row.source,
        amount: Math.abs(row.delta ?? 0),
        balance_after: 0,
        description: row.source || row.type || 'Transaction',
        created_at: row.created_at,
        wallet_type: 'sprr',
      }));

      return { transactions };
    },
    placeholderData: prev => prev,
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
                onChange={e => setSearch(e.target.value)}
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
                        <td key={j}><div className="h-4 bg-base-elevated rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : txs.map(tx => {
                  const badge = TX_TYPE_BADGE[tx.type] ?? TX_TYPE_BADGE['credit']!;
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                      className={cn('cursor-pointer', selectedTx?.id === tx.id && 'bg-base-elevated')}
                    >
                      <td>
                        <div className="font-mono text-xs text-text-muted">{tx.id.slice(0, 8)}…</div>
                        <div className="text-xs text-text-secondary truncate max-w-xs">{tx.description}</div>
                      </td>
                      <td><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td>
                        <span className="code text-[10px]">{tx.source}</span>
                      </td>
                      <td>
                        <span className={cn(
                          'font-semibold text-sm',
                          tx.type === 'credit'  ? 'text-status-success' :
                          tx.type === 'debit'   ? 'text-status-error' :
                          'text-text-secondary'
                        )}>
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedTx && (
          <div className="w-72 shrink-0 surface flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Transaction</span>
              <button onClick={() => setSelectedTx(null)} className="btn-ghost p-1 text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[
                { label: 'ID',          value: selectedTx.id },
                { label: 'User',        value: selectedTx.user_id },
                { label: 'Type',        value: selectedTx.type },
                { label: 'Source',      value: selectedTx.source },
                { label: 'Amount',      value: selectedTx.amount.toLocaleString() },
                { label: 'Balance After', value: selectedTx.balance_after.toLocaleString() },
                { label: 'Description', value: selectedTx.description },
                { label: 'Created At',  value: formatDateTime(selectedTx.created_at) },
              ].map(f => (
                <div key={f.label} className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">{f.label}</div>
                  <div className="code break-all">{f.value}</div>
                </div>
              ))}

              <div className="rounded-lg border border-status-success/20 bg-status-success/5 p-3 text-xs text-status-success">
                This transaction is immutable. It cannot be modified or deleted.
                Manual corrections create new ledger entries.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

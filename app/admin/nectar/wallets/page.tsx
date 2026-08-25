'use client';

/**
 * NECTAR Wallets — real ledger explorer.
 *
 * FIXED (see ADMIN_CURRENT_STATE.md / UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md):
 * this page previously read StreetPlayR's legacy `wallet_transactions`
 * table (via listAdminWalletTransactionsAction in app/actions/ops/wallets.ts)
 * — a completely different, unrelated, StreetPlayR-local table. The
 * canonical NECTAR ecosystem ledger is `nectar_wallet_transactions`
 * (verified live and working — see NECTAR_FOUNDATION_GREEN_REPORT.md).
 * This page now reads through listNectarLedgerAction, which goes
 * through lib/nectar/service.ts, the one sanctioned NECTAR read seam.
 * Read-only — no direct ledger writes from this page or any Admin UI.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge } from '@/components/ops2/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { listNectarLedgerAction } from '@/app/actions/admin/nectar';
import type { NectarLedgerTransaction } from '@/lib/nectar/service';

const TX_TYPE_BADGE: Record<string, { variant: 'success' | 'error' | 'info' | 'warning' | 'muted'; label: string }> = {
  credit: { variant: 'success', label: 'credit' },
  debit: { variant: 'error', label: 'debit' },
  hold: { variant: 'warning', label: 'hold' },
  release: { variant: 'info', label: 'release' },
  expire: { variant: 'muted', label: 'expire' },
};

export default function NectarWalletsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ['nectar-ledger', page],
    queryFn: async () => {
      const result = await listNectarLedgerAction({ limit: pageSize, offset: (page - 1) * pageSize });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    placeholderData: (prev) => prev,
  });

  const transactions = data?.transactions ?? [];
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  const columns: DataTableColumn<NectarLedgerTransaction>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (row) => {
        const badge = TX_TYPE_BADGE[row.type] ?? { variant: 'muted' as const, label: row.type };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    { key: 'source', header: 'Source' },
    { key: 'userId', header: 'User', render: (row) => <span className="font-mono text-xs">{row.userId.slice(0, 8)}…</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className={row.type === 'debit' ? 'text-status-error' : 'text-status-success'}>
          {row.type === 'debit' ? '-' : '+'}
          {row.amount ?? '—'}
        </span>
      ),
    },
    { key: 'balanceAfter', header: 'Balance after', align: 'right' },
    { key: 'referenceType', header: 'Reference', render: (row) => row.referenceType ?? '—' },
    { key: 'createdAt', header: 'Time', render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="NECTAR Wallets" />

      <div className="flex-1 pt-14 p-5 flex flex-col gap-4 min-h-0">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
          <span className="text-status-success">nectar_wallet_transactions — append-only, immutable</span>
        </div>

        <div className="surface flex-1 min-h-0 overflow-y-auto">
          <DataTable
            columns={columns}
            data={transactions}
            rowKey={(row) => row.id}
            loading={isLoading}
            error={error instanceof Error ? error.message : null}
            emptyTitle="No ledger transactions yet"
            emptyDescription="Real transactions will appear here once purchase.completed events grant rewards."
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

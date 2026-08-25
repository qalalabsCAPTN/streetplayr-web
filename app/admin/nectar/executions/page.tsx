'use client';

/**
 * NECTAR Reward Executions — real data, per Phase 7 ("read-side first").
 * New page: no prior equivalent existed in app/admin (the closest thing,
 * app/admin/nectar/rewards, showed reward *rules*, not executions — see
 * ADMIN_CURRENT_STATE.md). This is where "did purchase X actually grant
 * Y points" gets answered, tying event -> rule -> ledger transaction
 * together for a single row — the same chain
 * NECTAR_FOUNDATION_GREEN_REPORT.md proved against the real database.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, MinusCircle, Clock } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge } from '@/components/ops2/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { listNectarRewardExecutionsAction } from '@/app/actions/admin/nectar';
import type { NectarRewardExecution } from '@/lib/nectar/service';

const STATUS_META: Record<string, { icon: typeof CheckCircle2; variant: 'success' | 'error' | 'muted' | 'warning'; label: string }> = {
  success: { icon: CheckCircle2, variant: 'success', label: 'success' },
  failed: { icon: XCircle, variant: 'error', label: 'failed' },
  skipped: { icon: MinusCircle, variant: 'muted', label: 'skipped' },
  pending: { icon: Clock, variant: 'warning', label: 'pending' },
};

export default function NectarExecutionsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const pageSize = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ['nectar-executions', page, statusFilter],
    queryFn: async () => {
      const result = await listNectarRewardExecutionsAction({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: statusFilter,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    placeholderData: (prev) => prev,
  });

  const executions = data?.executions ?? [];
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  const columns: DataTableColumn<NectarRewardExecution>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const meta = STATUS_META[row.status] ?? STATUS_META.pending;
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    { key: 'ruleName', header: 'Rule', render: (row) => row.ruleName ?? row.ruleId.slice(0, 8) },
    { key: 'userId', header: 'User', render: (row) => <span className="font-mono text-xs">{row.userId.slice(0, 8)}…</span> },
    {
      key: 'pointsGranted',
      header: 'Points',
      align: 'right',
      render: (row) => (row.pointsGranted > 0 ? <span className="text-status-success">+{row.pointsGranted}</span> : '—'),
    },
    { key: 'multiplierApplied', header: '×', align: 'right', render: (row) => row.multiplierApplied.toFixed(2) },
    {
      key: 'failureReason',
      header: 'Detail',
      render: (row) => (row.failureReason ? <span className="text-status-error text-xs">{row.failureReason}</span> : '—'),
    },
    { key: 'createdAt', header: 'Time', render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Reward Executions" />

      <div className="flex-1 pt-14 p-5 flex flex-col gap-4 min-h-0">
        <div className="flex items-center gap-2">
          {(['success', 'failed', 'skipped', undefined] as const).map((s) => (
            <button
              key={s ?? 'all'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                statusFilter === s ? 'border-nectar-400 text-nectar-400' : 'border-border text-text-secondary'
              }`}
            >
              {s ?? 'all'}
            </button>
          ))}
        </div>

        <div className="surface flex-1 min-h-0 overflow-y-auto">
          <DataTable
            columns={columns}
            data={executions}
            rowKey={(row) => row.id}
            loading={isLoading}
            error={error instanceof Error ? error.message : null}
            emptyTitle="No reward executions yet"
            emptyDescription="Executions appear here every time RewardEngine evaluates an event against a rule."
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

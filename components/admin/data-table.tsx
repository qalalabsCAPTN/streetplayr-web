'use client';

/**
 * Generic Admin DataTable — server-driven pagination, sorting, search.
 *
 * Deliberately lightweight (no @tanstack/react-table dependency — this
 * repo doesn't have it installed, and the existing ops2 UI layer is
 * already a hand-rolled style; adding a new table-engine dependency for
 * this pass would be more churn than value). Column-config pattern
 * loosely modeled on Airbone's `shared/data-table.tsx` (see
 * AIRBONE_ADMIN_REFERENCE_AUDIT.md §6) — generic `ColumnDef`, server
 * pagination via `pageCount`/`page`/`onPageChange`, loading skeleton
 * rows, empty state — adapted rather than copied (Airbone's version is
 * TanStack-Table-bound; this one isn't).
 */
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ops2/ui/empty-state';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onToggleSelect?: (key: string) => void;
  bulkActions?: ReactNode;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  error,
  emptyTitle = 'No results',
  emptyDescription,
  page = 1,
  pageCount,
  onPageChange,
  onRowClick,
  selectable,
  selectedKeys,
  onToggleSelect,
  bulkActions,
  skeletonRows = 6,
}: DataTableProps<T>) {
  const hasSelection = selectable && (selectedKeys?.size ?? 0) > 0;

  return (
    <div className="flex flex-col">
      {hasSelection && bulkActions && (
        <div className="flex items-center gap-3 border-b border-border bg-base-elevated px-4 py-2 text-xs">
          <span className="text-text-secondary">{selectedKeys!.size} selected</span>
          {bulkActions}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
              {selectable && <th className="w-8 px-3 py-2" />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 font-medium ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-6 text-center text-sm text-status-error">
                  {error}
                </td>
              </tr>
            )}

            {!error && loading &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-border/50">
                  {selectable && <td className="px-3 py-3" />}
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3">
                      <div className="h-3.5 w-full max-w-[140px] animate-pulse rounded bg-base-elevated" />
                    </td>
                  ))}
                </tr>
              ))}

            {!error && !loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-10">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}

            {!error &&
              !loading &&
              data.map((row) => {
                const key = rowKey(row);
                const isSelected = selectedKeys?.has(key);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-border/50 ${onRowClick ? 'cursor-pointer hover:bg-base-elevated' : ''} ${isSelected ? 'bg-base-elevated' : ''}`}
                  >
                    {selectable && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected ?? false}
                          onChange={() => onToggleSelect?.(key)}
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-2.5 text-text-primary ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className ?? ''}`}
                      >
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {onPageChange && pageCount !== undefined && pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

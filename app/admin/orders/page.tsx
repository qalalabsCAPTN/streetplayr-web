'use client';

import { useQuery } from '@tanstack/react-query';
import { TopBar } from '@/components/ops2/top-bar';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import { Badge } from '@/components/ops2/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/ops2/format';
import { usePlatform } from '@/hooks/ops2/use-platform';
import { listAdminOrdersAction } from '@/app/actions/ops/orders-admin';

const STATUS_VARIANT: Record<string, 'success' | 'error' | 'warning' | 'info' | 'muted'> = {
  delivered: 'success',
  cancelled: 'error',
  refunded: 'error',
  processing: 'warning',
  pending: 'warning',
  fulfilling: 'warning',
  shipped: 'info',
  confirmed: 'info',
  returned: 'muted',
};

export default function OrdersPage() {
  const { apiParam } = usePlatform();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', apiParam],
    queryFn: async () => {
      const result = await listAdminOrdersAction({
        siteSlug: apiParam || undefined,
        limit: 50,
      });
      return { orders: result.orders ?? [] };
    },
    placeholderData: (prev) => prev,
  });

  const orders = data?.orders ?? [];

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Orders" />
      <div className="flex-1 pt-14 p-5 flex flex-col gap-5 min-h-0">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {orders.length
              ? `${orders.length.toLocaleString()} recent orders`
              : 'Cross-platform order history'}
          </p>
        </div>

        <div className="surface flex-1 overflow-hidden flex flex-col">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created</th>
              </tr>
            </thead>
          </table>
          <div className="flex-1 overflow-y-auto">
            <table className="data-table">
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-4 bg-base-elevated rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title="No orders found"
                        description="Orders for the selected platform will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/orders/${order.id}`;
                      }}
                    >
                      <td>
                        <div className="font-mono text-xs text-text-primary">
                          {order.order_number || order.id.slice(0, 8)}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-[10px] text-text-muted">
                          {order.customer_email}
                        </span>
                      </td>
                      <td>
                        <Badge variant={STATUS_VARIANT[order.status] ?? 'muted'}>
                          {order.status.replaceAll('_', ' ')}
                        </Badge>
                      </td>
                      <td className="font-medium text-text-primary">
                        {formatCurrency(order.grand_total)}
                      </td>
                      <td className="text-text-muted">{formatRelativeTime(order.created_at)}</td>
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

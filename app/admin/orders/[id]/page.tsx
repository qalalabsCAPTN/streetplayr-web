'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge } from '@/components/ops2/ui/badge';
import { formatCurrency } from '@/lib/ops2/format';
import { OrderPriceBreakdown } from '@/components/commerce/OrderPriceBreakdown';
import { resolveOrderGstPercent } from '@/lib/commerce/totals';
import { getAdminOrderAction } from '@/app/actions/ops/orders-admin';
import { transitionAdminOrderAction } from '@/app/actions/ops/order-transitions';

const NEXT: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled', 'refunded'],
  processing: ['fulfilling', 'shipped', 'cancelled', 'refunded'],
  fulfilling: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'returned', 'refunded'],
  delivered: ['returned', 'refunded'],
  returned: ['refunded'],
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => getAdminOrderAction(id),
  });
  const mutate = useMutation({
    mutationFn: (status: string) => transitionAdminOrderAction(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-order', id] }),
  });

  const order = data?.success ? data.order : null;

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Order" />
      <div className="flex-1 pt-14 p-5 space-y-5 overflow-y-auto">
        <Link href="/admin/orders" className="text-xs font-mono text-text-muted">
          ← Orders
        </Link>
        {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
        {data && !data.success && <p className="text-sm text-status-error">{data.error}</p>}
        {order && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="page-title">{order.orderNumber}</h2>
                <p className="text-sm text-text-muted mt-1">
                  {order.paymentStatus ?? 'payment unknown'} · {order.fulfillmentStatus ?? 'unfulfilled'}
                </p>
              </div>
              <Badge variant="info">{order.status}</Badge>
            </div>
            <div className="surface p-4 space-y-2">
              <OrderPriceBreakdown
                subtotal={order.subtotal}
                discount={order.discountTotal ?? 0}
                shipping={order.shippingCost}
                tax={order.taxAmount}
                grandTotal={order.total}
                taxPercent={resolveOrderGstPercent(order)}
              />
            </div>
            <div className="surface p-4">
              <h3 className="text-sm font-medium mb-3">Line items</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productTitle ?? item.productId}</td>
                      <td className="font-mono text-xs">{item.sku ?? '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="surface p-4 space-y-2 text-sm">
              <h3 className="font-medium">Fulfillment</h3>
              <p>Tracking: {order.trackingNumber || '—'}</p>
              <p>Carrier: {order.carrier || '—'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(NEXT[order.status] ?? []).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={mutate.isPending}
                  className="px-3 py-2 text-xs font-mono uppercase border border-white/10 rounded"
                  onClick={() => mutate.mutate(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            {mutate.data && !mutate.data.success && (
              <p className="text-sm text-status-error">{mutate.data.error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

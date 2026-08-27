import type { Order } from '@/lib/orchestration/types';

/** Statuses that only exist after a verified capture (live orders.status CHECK). */
const PAID_FULFILLMENT = new Set([
  'confirmed',
  'processing',
  'fulfilling',
  'shipped',
  'delivered',
  'returned',
  'refunded',
]);

export function ownsOrder(
  order: Pick<Order, 'userId'> & { shippingAddress?: { email?: string } | Record<string, unknown> },
  userId: string,
  email?: string | null
): boolean {
  if (order.userId && order.userId === userId) return true;
  const ship = order.shippingAddress as { email?: string } | undefined;
  if (email && ship?.email && ship.email.toLowerCase() === email.toLowerCase()) return true;
  return false;
}

/** Verified Easebuzz (or other gateway) capture, not a pending checkout row. */
export function isPaymentCaptured(order: { status: string; paymentStatus?: string | null }): boolean {
  return order.paymentStatus === 'paid' && PAID_FULFILLMENT.has(order.status);
}

export function isInvoiceEligible(order: { status: string; paymentStatus?: string | null }): boolean {
  return isPaymentCaptured(order);
}

export function isPayableOrder(order: { status: string; paymentStatus?: string | null }): boolean {
  return order.status === 'pending' && order.paymentStatus !== 'paid';
}

export function countsTowardCustomerSpend(order: { status: string; paymentStatus?: string | null }): boolean {
  if (!isPaymentCaptured(order)) return false;
  return order.status !== 'refunded' && order.status !== 'returned';
}

export function customerOrderStatusLabel(order: { status: string; paymentStatus?: string | null }): string {
  if (order.status === 'pending') {
    if (order.paymentStatus === 'failed') return 'Payment failed';
    return 'Payment pending';
  }
  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    processing: 'Processing',
    fulfilling: 'Fulfilling',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
    refunded: 'Refunded',
  };
  return labels[order.status] ?? order.status;
}

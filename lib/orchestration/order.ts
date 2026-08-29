import { createAdminClient } from '@/lib/supabase/admin';
import { resolveStorefrontBrandId } from '@/lib/products/brand';
import type { Order, OrderItem, OrderStatus, OrchestrationResponse } from './types';
import { recordEvent } from './events';
import { emitPurchaseCompleted } from '@/lib/nectar/purchase-event';

/**
 * Fires the NECTAR purchase.completed bridge event exactly once, at the
 * pending -> confirmed transition (the real "payment succeeded, order is
 * now real" signal in this codebase). Never throws and never blocks the
 * order transition — a NECTAR outage must not fail a StreetPlayR order.
 * See PURCHASE_COMPLETED_CONTRACT.md.
 */
function fireNectarPurchaseCompletedIfNewlyConfirmed(fromStatus: string, updatedOrder: any): void {
  if (fromStatus !== 'pending' || updatedOrder.status !== 'confirmed') return;
  void emitPurchaseCompleted({
    id: updatedOrder.id,
    customer_id: updatedOrder.customer_id ?? null,
    grand_total: updatedOrder.grand_total ?? null,
    currency: updatedOrder.currency ?? null,
  }).catch((e) => {
    console.error('[nectar] purchase.completed emit threw unexpectedly:', e);
  });
}

async function notifyOrderStatus(order: Order, fromStatus: string, targetStatus: string): Promise<void> {
  const email = (order.shippingAddress as { email?: string }).email;
  if (!email) return;
  const { sendTransactionalEmail, orderEmailHtml, orderEmailText } = await import('@/lib/notifications/email');
  const map: Record<string, { template: 'order_confirmation' | 'shipment' | 'delivery' | 'refund' | 'cancellation'; title: string; body: string }> = {
    confirmed: { template: 'order_confirmation', title: 'Order confirmed', body: 'Payment verified. We are preparing your order.' },
    shipped: { template: 'shipment', title: 'Order shipped', body: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Your order is on the way.' },
    delivered: { template: 'delivery', title: 'Order delivered', body: 'Your StreetPlayR order was delivered.' },
    refunded: { template: 'refund', title: 'Refund processed', body: 'A refund was issued for this order.' },
    cancelled: { template: 'cancellation', title: 'Order cancelled', body: 'This order was cancelled. Inventory was released.' },
  };
  const mail = map[targetStatus];
  if (!mail) return;
  const details =
    targetStatus === 'confirmed'
      ? {
          items: order.items.map((item) => ({
            title:
              [item.productTitle, item.variantTitle].filter(Boolean).join(' — ') ||
              item.sku ||
              'Item',
            quantity: item.quantity,
            price: item.price,
          })),
          total: order.total,
          currency: order.currency,
        }
      : undefined;
  await sendTransactionalEmail({
    to: email,
    template: mail.template,
    orderId: order.id,
    html: orderEmailHtml(mail.title, mail.body, order.orderNumber, details),
    text: orderEmailText(mail.title, mail.body, order.orderNumber, details),
  });
  void fromStatus;
}

// CORRECTION (verified against a live pg_dump of the actual DB, not the
// migration files — see orders_status_check below): the migration files in
// this repo describe an order_status ENUM with values that were never
// actually applied to this database. The real live `orders.status` column
// is TEXT with a CHECK constraint:
//   orders_status_check: status = ANY (
//     'pending','confirmed','processing','fulfilling','shipped',
//     'delivered','cancelled','returned','refunded'
//   )
// A previous pass here mistakenly "fixed" this map to a draft/pending_payment/
// on_hold vocabulary sourced from 00005/99999 — those values do not exist in
// the live CHECK constraint and would have made every order insert/transition
// throw once the app hit the real DB. Reverted to the live-verified vocabulary.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled', 'refunded'],
  processing: ['fulfilling', 'shipped', 'cancelled', 'refunded'],
  fulfilling: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'returned', 'refunded'],
  delivered: ['returned', 'refunded'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],
};

function itemsFromDb(rows: any[] | null | undefined): OrderItem[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    variantId: row.variant_id,
    productTitle: row.product_title,
    variantTitle: row.variant_title,
    sku: row.sku,
    quantity: row.quantity,
    price: Number(row.unit_price ?? row.total_price ?? 0),
    metadata: row.metadata ?? {},
  }));
}

function orderFromDb(row: any, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    orderNumber: row.order_number ?? row.id,
    userId: row.notes ?? '',
    customerId: row.customer_id,
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    total: Number(row.grand_total ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    shippingCost: Number(row.shipping_total ?? row.shipping_cost ?? 0),
    taxAmount: Number(row.tax_total ?? row.tax_amount ?? 0),
    discountTotal: Number(row.discount_total ?? 0),
    currency: row.currency ?? 'INR',
    shippingAddress: row.shipping_address ?? {},
    billingAddress: row.billing_address,
    paymentIntentId: row.payment_intent_id,
    trackingNumber: row.tracking_number ?? null,
    carrier: row.carrier ?? null,
    items,
    metadata: {},
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const OrderService = {
  async getForUser(userId: string): Promise<Order[]> {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) return [];

      const brandId = await resolveStorefrontBrandId(admin);
      const { data: customer } = await admin
        .from('customers')
        .select('id')
        .eq('email', profile.email)
        .eq('brand_id', brandId)
        .single();

      if (!customer) return [];

      const { data } = await admin
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      const ids = (data ?? []).map((o: { id: string }) => o.id);
      const { data: itemRows } = ids.length
        ? await admin.from('order_items').select('*').in('order_id', ids)
        : { data: [] as any[] };
      const byOrder = new Map<string, ReturnType<typeof itemsFromDb>>();
      for (const row of itemRows ?? []) {
        const list = byOrder.get(row.order_id) ?? [];
        list.push(...itemsFromDb([row]));
        byOrder.set(row.order_id, list);
      }

      return (data ?? []).map((row: any) => orderFromDb(row, byOrder.get(row.id) ?? []));
    } catch {
      return [];
    }
  },

  async getById(orderId: string): Promise<Order | null> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (!data) return null;
      const { data: itemRows } = await admin.from('order_items').select('*').eq('order_id', orderId);
      return orderFromDb(data, itemsFromDb(itemRows));
    } catch {
      return null;
    }
  },

  async submitForPayment(
    orderId: string,
    paymentIntentId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    try {
      const admin = createAdminClient();

      const { data: updated, error } = await admin
        .from('orders')
        .update({ payment_intent_id: paymentIntentId })
        .eq('id', orderId)
        .eq('status', 'pending')
        .select('*')
        .single();

      if (error || !updated) {
        return {
          success: false,
          error: 'Order not in pending status or concurrent modification.',
          code: 'TRANSITION_FAILED',
        };
      }

      await recordEvent({
        domain: 'order',
        severity: 'info',
        action: 'order.submitted_for_payment',
        actorId,
        resourceType: 'orders',
        resourceId: orderId,
        message: `Order submitted for payment — PaymentIntent ${paymentIntentId}`,
        metadata: { paymentIntentId },
      });

      return { success: true, data: orderFromDb(updated) };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'ORDER_TRANSITION_ERROR' };
    }
  },

  async confirm(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'confirmed', actorId);
  },

  async startFulfillment(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'processing', actorId);
  },

  async ship(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'shipped', actorId);
  },

  async deliver(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'delivered', actorId);
  },

  async cancel(
    orderId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'cancelled', actorId, reason);
  },

  async hold(
    orderId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    await recordEvent({
      domain: 'order',
      severity: 'warning',
      action: 'order.hold_unsupported',
      actorId,
      resourceType: 'orders',
      resourceId: orderId,
      message: `Hold requested but live orders.status has no on_hold value${reason ? ': ' + reason : ''}`,
      metadata: { reason },
    });
    const order = await this.getById(orderId);
    if (!order) return { success: false, error: 'Order not found.', code: 'NOT_FOUND' };
    return { success: true, data: order };
  },

  async refund(
    orderId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'refunded', actorId, reason);
  },

  async transitionStatus(
    orderId: string,
    targetStatus: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    try {
      const admin = createAdminClient();

      const { data: current } = await admin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!current) {
        return { success: false, error: 'Order not found.', code: 'NOT_FOUND' };
      }

      const allowed = VALID_TRANSITIONS[current.status];
      if (!allowed?.includes(targetStatus)) {
        return {
          success: false,
          error: `Invalid transition: ${current.status} -> ${targetStatus}`,
          code: 'INVALID_TRANSITION',
        };
      }

      // `notes` stores the creating auth user's id (see checkout.ts) — never
      // overwrite it with automated payment transition audit strings.
      const notesUpdate =
        reason && !reason.startsWith('payment:') ? reason : current.notes;

      const { data: updated, error } = await admin
        .from('orders')
        .update({ status: targetStatus, notes: notesUpdate })
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message, code: 'TRANSITION_FAILED' };
      }

      await recordEvent({
        domain: 'order',
        severity: targetStatus === 'cancelled' || targetStatus === 'refunded' ? 'warning' : 'info',
        action: `order.${targetStatus}`,
        actorId,
        resourceType: 'orders',
        resourceId: orderId,
        message: `Order ${current.status} -> ${targetStatus}${reason ? ': ' + reason : ''}`,
        metadata: { fromStatus: current.status, toStatus: targetStatus, reason },
      });

      fireNectarPurchaseCompletedIfNewlyConfirmed(current.status, updated);

      if (targetStatus === 'cancelled' || targetStatus === 'refunded') {
        const { ReservationService } = await import('./reservation');
        await ReservationService.releaseAllForOrder(orderId, actorId, targetStatus);
      }

      const hydrated = orderFromDb(updated, itemsFromDb(
        (await admin.from('order_items').select('*').eq('order_id', orderId)).data
      ));
      await notifyOrderStatus(hydrated, current.status, targetStatus);
      return { success: true, data: hydrated };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'ORDER_TRANSITION_ERROR' };
    }
  },

  async findByPaymentIntent(paymentIntentId: string): Promise<Order | null> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('orders')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();
      return data ? orderFromDb(data) : null;
    } catch {
      return null;
    }
  },
};

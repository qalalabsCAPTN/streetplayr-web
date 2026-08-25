import { createAdminClient } from '@/lib/supabase/admin';
import { resolveStorefrontBrandId } from '@/lib/products/brand';
import type { Order, OrderStatus, OrchestrationResponse } from './types';
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

function orderFromDb(row: any): Order {
  return {
    id: row.id,
    userId: row.notes ?? '',
    status: row.status,
    total: row.grand_total ?? 0,
    subtotal: row.subtotal ?? 0,
    shippingCost: row.shipping_total ?? 0,
    taxAmount: row.tax_total ?? 0,
    currency: row.currency ?? 'INR',
    shippingAddress: row.shipping_address ?? {},
    billingAddress: row.billing_address,
    paymentIntentId: row.payment_intent_id,
    metadata: row.metadata ?? {},
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

      return (data ?? []).map(orderFromDb);
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
      return data ? orderFromDb(data) : null;
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
        .update({ status: 'confirmed' })
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

      fireNectarPurchaseCompletedIfNewlyConfirmed('pending', updated);

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
    return this.transitionStatus(orderId, 'on_hold', actorId, reason);
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

      return { success: true, data: orderFromDb(updated) };
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

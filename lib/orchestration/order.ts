/**
 * Order Lifecycle Orchestration Service
 *
 * Server-authoritative order state machine.
 * All mutations are server-only. Client never writes order state.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { Order, OrderStatus, OrchestrationResponse } from './types';
import { recordEvent } from './events';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['confirmed', 'cancelled', 'on_hold'],
  confirmed: ['processing', 'on_hold', 'refunded', 'cancelled'],
  processing: ['shipped', 'on_hold', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  on_hold: ['confirmed', 'cancelled', 'refunded'],
  refunded: [],
};

function orderFromDb(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    total: row.total,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost ?? 0,
    taxAmount: row.tax_amount ?? 0,
    currency: row.currency ?? 'usd',
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
  /**
   * Create a new order in 'draft' status.
   * Called when user enters checkout with intent to purchase.
   */
  async create(params: {
    userId: string;
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    total: number;
    currency?: string;
    shippingAddress: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<OrchestrationResponse<Order>> {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('orders')
        .insert({
          user_id: params.userId,
          status: 'draft',
          subtotal: params.subtotal,
          shipping_cost: params.shippingCost,
          tax_amount: params.taxAmount,
          total: params.total,
          currency: params.currency ?? 'usd',
          shipping_address: params.shippingAddress,
          metadata: params.metadata ?? {},
        })
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message, code: 'ORDER_CREATE_FAILED' };
      }

      await recordEvent({
        domain: 'order',
        severity: 'info',
        action: 'order.created',
        actorId: params.userId,
        resourceType: 'orders',
        resourceId: data.id,
        message: `Order created — ${params.total} ${params.currency ?? 'usd'}`,
        metadata: { subtotal: params.subtotal, total: params.total },
      });

      return { success: true, data: orderFromDb(data) };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'ORDER_ERROR' };
    }
  },

  /**
   * Transition order from draft → pending_payment.
   * Links a PaymentIntent ID. Called before client-side payment confirmation.
   *
   * Atomic: updates BOTH status and payment_intent_id in a single query.
   * Guarded: only succeeds if order is still in 'draft' (prevents concurrent modification).
   */
  async submitForPayment(
    orderId: string,
    paymentIntentId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    try {
      const admin = createAdminClient();

      const { data: updated, error } = await admin
        .from('orders')
        .update({
          status: 'pending_payment',
          payment_intent_id: paymentIntentId,
        })
        .eq('id', orderId)
        .eq('status', 'draft')
        .select('*')
        .single();

      if (error || !updated) {
        return {
          success: false,
          error: 'Order not in draft status or concurrent modification.',
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

  /**
   * Transition order to 'confirmed' — payment received.
   * This is the authoritative payment confirmation point.
   */
  async confirm(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'confirmed', actorId);
  },

  /**
   * Transition order to 'processing' — fulfillment begins.
   */
  async startFulfillment(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'processing', actorId);
  },

  /**
   * Transition order to 'shipped'.
   */
  async ship(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'shipped', actorId);
  },

  /**
   * Transition order to 'delivered'.
   */
  async deliver(
    orderId: string,
    actorId: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'delivered', actorId);
  },

  /**
   * Cancel an order. Before payment = release. After payment = refund.
   */
  async cancel(
    orderId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'cancelled', actorId, reason);
  },

  /**
   * Place order on hold (payment review).
   */
  async hold(
    orderId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'on_hold', actorId, reason);
  },

  /**
   * Refund an order (post-fulfillment).
   */
  async refund(
    orderId: string,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    return this.transitionStatus(orderId, 'refunded', actorId, reason);
  },

  /**
   * Internal — transition order status with validation and event logging.
   */
  async transitionStatus(
    orderId: string,
    targetStatus: OrderStatus,
    actorId: string,
    reason?: string
  ): Promise<OrchestrationResponse<Order>> {
    try {
      const admin = createAdminClient();

      // Fetch current
      const { data: current } = await admin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!current) {
        return { success: false, error: 'Order not found.', code: 'NOT_FOUND' };
      }

      // Validate transition
      const allowed = VALID_TRANSITIONS[current.status as OrderStatus];
      if (!allowed?.includes(targetStatus)) {
        return {
          success: false,
          error: `Invalid transition: ${current.status} → ${targetStatus}`,
          code: 'INVALID_TRANSITION',
        };
      }

      const { data: updated, error } = await admin
        .from('orders')
        .update({ status: targetStatus, notes: reason ?? current.notes })
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
        message: `Order ${current.status} → ${targetStatus}${reason ? `: ${reason}` : ''}`,
        metadata: { fromStatus: current.status, toStatus: targetStatus, reason },
      });

      return { success: true, data: orderFromDb(updated) };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'ORDER_TRANSITION_ERROR' };
    }
  },

  /**
   * Find an order by its Stripe PaymentIntent ID.
   * Used by webhook handler for reconciliation.
   */
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

  /**
   * Get all orders for a user.
   */
  async getForUser(userId: string): Promise<Order[]> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return (data ?? []).map(orderFromDb);
    } catch {
      return [];
    }
  },

  /**
   * Get order by ID (admin).
   */
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
};

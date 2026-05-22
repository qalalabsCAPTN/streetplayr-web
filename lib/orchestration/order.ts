import { createAdminClient } from '@/lib/supabase/admin';
import type { Order, OrderStatus, OrchestrationResponse } from './types';
import { recordEvent } from './events';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
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

      const { data: customer } = await admin
        .from('customers')
        .select('id')
        .eq('email', profile.email)
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
        message: `Order ${current.status} -> ${targetStatus}${reason ? ': ' + reason : ''}`,
        metadata: { fromStatus: current.status, toStatus: targetStatus, reason },
      });

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

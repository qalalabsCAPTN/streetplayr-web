/**
 * Payment Reconciliation Service
 *
 * Server-authoritative payment event processing.
 * Webhooks are the source of truth. Server actions provide optimistic UI.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderStatus, PaymentEvent, PaymentEventType, OrchestrationResponse } from './types';
import { recordEvent } from './events';
import { idempotencyGuard } from './idempotency';
import { OrderService } from './order';

/**
 * Map of payment event types to corresponding order status transitions.
 */
const ORDER_TRANSITION_MAP: Record<PaymentEventType, string | null> = {
  'payment_intent.created': null, // No order status change, reservation → held
  'payment_intent.processing': null,
  'payment_intent.succeeded': 'confirmed',
  'payment_intent.payment_failed': null, // Reserved stays held for retry
  'payment_intent.canceled': 'cancelled',
  'payment_intent.expired': 'cancelled',
  'charge.refunded': 'refunded',
  'charge.disputed': 'on_hold',
  'charge.refund.updated': null,
};

function paymentEventFromDb(row: any): PaymentEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    stripeEventId: row.stripe_event_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    amount: row.amount,
    currency: row.currency ?? 'usd',
    rawPayload: row.raw_payload,
    createdAt: row.created_at,
  };
}

export const PaymentService = {
  /**
   * Process an incoming payment event (from webhook).
   *
   * Steps:
   * 1. Idempotency check (skip if already processed)
   * 2. Look up order by payment_intent_id
   * 3. Log payment event
   * 4. Update order status if applicable
   * 5. Trigger reservation transition if applicable
   */
  async processWebhookEvent(params: {
    eventType: PaymentEventType;
    stripeEventId: string;
    stripePaymentIntentId: string;
    amount: number;
    currency?: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<OrchestrationResponse<PaymentEvent>> {
    // Idempotency — skip if this stripe event was already processed
    const guard = await idempotencyGuard(`stripe_event:${params.stripeEventId}`, {
      ttl: 86400,
    });

    if (!guard.canProceed) {
      return { success: true, data: guard.existingData as PaymentEvent };
    }

    try {
      const admin = createAdminClient();

      // Find order by payment intent
      const { data: order } = await admin
        .from('orders')
        .select('id, user_id, status')
        .eq('payment_intent_id', params.stripePaymentIntentId)
        .single();

      if (!order) {
        return {
          success: false,
          error: `No order found for PaymentIntent ${params.stripePaymentIntentId}`,
          code: 'ORDER_NOT_FOUND',
        };
      }

      // Log the payment event
      const { data: event, error: eventError } = await admin
        .from('payment_events')
        .insert({
          order_id: order.id,
          event_type: params.eventType,
          stripe_event_id: params.stripeEventId,
          stripe_payment_intent_id: params.stripePaymentIntentId,
          amount: params.amount,
          currency: params.currency ?? 'usd',
          raw_payload: params.rawPayload ?? {},
        })
        .select('*')
        .single();

      if (eventError) {
        return { success: false, error: eventError.message, code: 'EVENT_LOG_FAILED' };
      }

      // Route order status transition through OrderService — NEVER bypass the state machine
      const targetStatus = ORDER_TRANSITION_MAP[params.eventType] as OrderStatus | undefined;
      if (targetStatus) {
        const transitionResult = await OrderService.transitionStatus(
          order.id,
          targetStatus,
          'system',
          `payment:${params.eventType}`
        );
        if (!transitionResult.success) {
          await recordEvent({
            domain: 'payment',
            severity: 'error',
            action: `payment.transition_failed`,
            actorId: 'system',
            resourceType: 'payment_events',
            resourceId: event.id,
            message: `Order status transition failed: ${order.status} → ${targetStatus} for event ${params.eventType}`,
            metadata: {
              orderId: order.id,
              fromStatus: order.status,
              targetStatus,
              eventType: params.eventType,
              error: transitionResult.error,
            },
          });
        }
      }

      // Mark idempotency key as completed
      await guard.complete(paymentEventFromDb(event));

      return { success: true, data: paymentEventFromDb(event) };
    } catch (e: any) {
      return { success: false, error: e.message, code: 'PAYMENT_PROCESS_ERROR' };
    }
  },

  /**
   * Get payment events for an order.
   */
  async getForOrder(orderId: string): Promise<PaymentEvent[]> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('payment_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      return (data ?? []).map(paymentEventFromDb);
    } catch {
      return [];
    }
  },

  /**
   * Check if a PaymentIntent was already processed successfully.
   */
  async isPaymentConfirmed(paymentIntentId: string): Promise<boolean> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('payment_events')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('event_type', 'payment_intent.succeeded')
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  },
};

/**
 * Payment Reconciliation Service
 *
 * Server-authoritative payment event processing.
 * Webhooks are the source of truth. Server actions provide optimistic UI.
 *
 * Reservation transitions are handled here (not in the webhook handler)
 * so they're covered by the idempotency guard — preventing duplicate
 * reservation state changes on webhook replay.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderStatus, PaymentEvent, PaymentEventType, OrchestrationResponse } from './types';
import { recordEvent } from './events';
import { idempotencyGuard } from './idempotency';
import { OrderService } from './order';
import { ReservationService } from './reservation';
import { awardSPRR, awardXP, processReferral } from '@/lib/nectar/engine';
import { UnicommerceService, UnicommerceLogger } from '@/src/integrations/unicommerce';

/**
 * Map of payment event types to corresponding reservation state transitions.
 * Each entry maps a Stripe event to a function that transitions all
 * reservations linked to the affected order.
 */
const RESERVATION_TRANSITION_MAP: Record<string, (id: string, actor: string) => Promise<any>> = {
  'payment_intent.created': ReservationService.hold,
  'payment_intent.succeeded': ReservationService.convert,
  'payment_intent.payment_failed': (id, actor) =>
    ReservationService.release(id, actor, 'payment_failed'),
  'payment_intent.canceled': (id, actor) =>
    ReservationService.release(id, actor, 'payment_cancelled'),
  'charge.refunded': (id, actor) =>
    ReservationService.release(id, actor, 'refund'),
};

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
        // If unique constraint violation, the event was already logged.
        // This can happen on retry after partial failure. Safe to skip.
        if (eventError.message?.includes('unique') || eventError.message?.includes('idx_payment_events')) {
          await guard.complete(null);
          return { success: true, data: null as any };
        }
        await guard.fail(eventError.message);
        return { success: false, error: eventError.message, code: 'EVENT_LOG_FAILED' };
      }

      // Emit payment event
      await recordEvent({
        domain: 'payment',
        severity: params.eventType === 'payment_intent.succeeded' ? 'info' : 'warning',
        action: `payment.${params.eventType.replace(/\./g, '_')}`,
        actorId: 'system',
        resourceType: 'payment_events',
        resourceId: event.id,
        message: `Payment event: ${params.eventType} — ${params.amount} ${params.currency ?? 'usd'}`,
        metadata: {
          orderId: order.id,
          eventType: params.eventType,
          stripeEventId: params.stripeEventId,
          amount: params.amount,
        },
      });

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
          // Mark idempotency as failed so retry doesn't reprocess from scratch
          await guard.fail(transitionResult.error);
          return { success: false, error: transitionResult.error, code: 'TRANSITION_FAILED' };
        } else if (params.eventType === 'payment_intent.succeeded') {
          // Emit payment.completed on successful payment
          await recordEvent({
            domain: 'payment',
            severity: 'info',
            action: 'payment.completed',
            actorId: 'system',
            resourceType: 'orders',
            resourceId: order.id,
            message: `Payment completed for order ${order.id} — ${params.amount} ${params.currency ?? 'usd'}`,
            metadata: {
              orderId: order.id,
              paymentIntentId: params.stripePaymentIntentId,
              amount: params.amount,
              eventType: params.eventType,
            },
          });

          // NECTAR: award XP and SPRR on successful payment
          const sprrAward = Math.floor(params.amount / 100);
          const xpAward = Math.floor(params.amount / 50);
          if (sprrAward > 0) {
            await awardSPRR(order.user_id, sprrAward, `Order #${order.id.slice(0, 8)}`, 'earned');
          }
          if (xpAward > 0) {
            await awardXP(order.user_id, xpAward, `Order #${order.id.slice(0, 8)}`);
          }

          // NECTAR: process referral if this is the referred user's first paid order
          await processReferral(order.user_id);

          // UNICOMMERCE: Forward confirmed order to Unicommerce (fire-and-forget)
          // Failures are logged but do NOT block order confirmation.
          try {
            const { data: orderItems } = await admin
              .from('order_items')
              .select('variant_id, quantity, unit_price, product_variants!inner(sku, title)')
              .eq('order_id', order.id);

            const { data: fullOrder } = await admin
              .from('orders')
              .select('id, display_code, shipping_address, billing_address, currency, metadata, created_at, grand_total')
              .eq('id', order.id)
              .single();

            if (fullOrder && orderItems && orderItems.length > 0) {
              const shippingAddr = fullOrder.shipping_address as Record<string, any> || {};
              const billingAddr = (fullOrder.billing_address as Record<string, any>) || shippingAddr;
              const channelCode = process.env.UNICOMMERCE_CHANNEL_CODE || 'STREETPLAYR_WEB';

              const ucResult = await UnicommerceService.orders.createOrder(
                {
                  id: fullOrder.id,
                  displayCode: fullOrder.display_code || fullOrder.id.slice(0, 12).toUpperCase(),
                  createdAt: fullOrder.created_at,
                  currency: fullOrder.currency || 'INR',
                  paymentMethod: 'PREPAID',
                  shippingAddress: {
                    name: shippingAddr.name || shippingAddr.full_name || '',
                    addressLine1: shippingAddr.address_line_1 || shippingAddr.addressLine1 || '',
                    addressLine2: shippingAddr.address_line_2 || shippingAddr.addressLine2 || '',
                    city: shippingAddr.city || '',
                    state: shippingAddr.state || '',
                    country: shippingAddr.country || 'IN',
                    pincode: shippingAddr.pincode || shippingAddr.zip || '',
                    phone: shippingAddr.phone || '',
                    email: shippingAddr.email || '',
                  },
                  billingAddress: {
                    name: billingAddr.name || billingAddr.full_name || '',
                    addressLine1: billingAddr.address_line_1 || billingAddr.addressLine1 || '',
                    addressLine2: billingAddr.address_line_2 || billingAddr.addressLine2 || '',
                    city: billingAddr.city || '',
                    state: billingAddr.state || '',
                    country: billingAddr.country || 'IN',
                    pincode: billingAddr.pincode || billingAddr.zip || '',
                    phone: billingAddr.phone || '',
                    email: billingAddr.email || '',
                  },
                  items: orderItems.map((item: any) => ({
                    sku: item.product_variants?.sku || '',
                    name: item.product_variants?.title || '',
                    price: item.unit_price,
                    quantity: item.quantity,
                  })),
                },
                channelCode
              );

              if (ucResult.success && ucResult.uniwareCode) {
                // Store Unicommerce code in order metadata for status sync
                const prevMeta = (fullOrder.metadata as Record<string, any>) || {};
                await admin
                  .from('orders')
                  .update({ metadata: { ...prevMeta, uniwareCode: ucResult.uniwareCode } })
                  .eq('id', order.id);
              }
            }
          } catch (ucErr: any) {
            // Non-blocking: log and continue
            await UnicommerceLogger.error(
              'payment.unicommerce_forward_failed',
              `Failed to forward order ${order.id} to Unicommerce`,
              ucErr,
              order.id
            );
          }
        }
      }

      // Trigger reservation transition if applicable
      const transitionFn = RESERVATION_TRANSITION_MAP[params.eventType];
      if (transitionFn) {
        const { data: reservations } = await admin
          .from('inventory_reservations')
          .select('id')
          .eq('order_id', order.id);

        if (reservations && reservations.length > 0) {
          const results = await Promise.allSettled(
            reservations.map(r => transitionFn(r.id, 'system'))
          );

          for (const result of results) {
            if (result.status === 'rejected') {
              await recordEvent({
                domain: 'payment',
                severity: 'error',
                action: 'payment.reservation_transition_failed',
                actorId: 'system',
                resourceType: 'payment_events',
                resourceId: event.id,
                message: `Reservation transition failed for event ${params.eventType}: ${result.reason}`,
                metadata: {
                  orderId: order.id,
                  eventType: params.eventType,
                  error: result.reason,
                },
              });
            }
          }
        }
      }

      // Mark idempotency key as completed
      await guard.complete(paymentEventFromDb(event));

      return { success: true, data: paymentEventFromDb(event) };
    } catch (e: any) {
      // Don't mark as failed on catch — allows Stripe retry
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

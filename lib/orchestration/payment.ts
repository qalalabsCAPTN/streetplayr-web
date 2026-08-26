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
import type { OrderStatus, PaymentEvent, PaymentEventType, PaymentProvider, OrchestrationResponse } from './types';
import { recordEvent } from './events';
import { idempotencyGuard } from './idempotency';
import { OrderService } from './order';
import { ReservationService } from './reservation';
import { redeemSPRR, refundSPRR } from '@/lib/nectar/engine';
import { UnicommerceService, UnicommerceLogger } from '@/src/integrations/unicommerce';

/**
 * Map of canonical payment event types to corresponding reservation state
 * transitions. Provider-neutral: gateway adapters map their vocabulary into
 * PaymentEventType before reaching this table.
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

/** Maps canonical payment events to orders.payment_status (live TEXT column). */
const PAYMENT_STATUS_MAP: Partial<Record<PaymentEventType, string>> = {
  'payment_intent.processing': 'pending',
  'payment_intent.succeeded': 'paid',
  'payment_intent.payment_failed': 'failed',
  'payment_intent.canceled': 'failed',
  'charge.refunded': 'refunded',
};

function paymentEventFromDb(row: any): PaymentEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    // Physical columns are still named stripe_event_id/stripe_payment_intent_id
    // — a provider-neutral rename migration has been proposed (see audit
    // report) but not yet applied to the live DB. This is the one place
    // that translation happens; nothing outside this file should ever read
    // the stripe_* names again.
    provider: (row.raw_payload as { provider?: PaymentProvider } | null)?.provider,
    providerEventId: row.stripe_event_id,
    providerTransactionId: row.stripe_payment_intent_id,
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
    provider: PaymentProvider;
    /** Provider-issued event id (Stripe's `event.id`, or an
     *  app-constructed `easebuzz:{txnid}:{eventType}` key). */
    providerEventId: string;
    /** Provider-issued transaction id (Stripe PaymentIntent id, Easebuzz txnid). */
    providerTransactionId: string;
    amount: number;
    currency?: string;
    rawPayload?: Record<string, unknown>;
  }): Promise<OrchestrationResponse<PaymentEvent>> {
    // Idempotency — skip if this exact provider event was already processed.
    // Namespaced by provider (defense in depth on top of each provider's
    // own event-id uniqueness).
    const guard = await idempotencyGuard(`payment_event:${params.provider}:${params.providerEventId}`, {
      ttl: 86400,
    });

    if (!guard.canProceed) {
      return { success: true, data: guard.existingData as PaymentEvent };
    }

    try {
      const admin = createAdminClient();

      // Find order by provider transaction id.
      // `notes` carries the creating auth user's id (set at order creation
      // in app/actions/checkout.ts, read the same way by OrderService's
      // orderFromDb() and by app/actions/payment.ts's ownership checks) —
      // this is the verified, already-live identity mechanism. The live
      // `orders` table has no `user_id` column; do not select one.
      const { data: order } = await admin
        .from('orders')
        .select('id, notes, status, discount_total')
        .eq('payment_intent_id', params.providerTransactionId)
        .single();

      if (!order) {
        return {
          success: false,
          error: `No order found for transaction ${params.providerTransactionId}`,
          code: 'ORDER_NOT_FOUND',
        };
      }

      // Log the payment event. Physical columns are still named
      // stripe_event_id/stripe_payment_intent_id pending the proposed
      // provider-neutral rename migration (not yet applied to the live DB
      // — see audit report). `provider` is stamped into raw_payload so it
      // survives the read path (paymentEventFromDb) even before that
      // migration lands.
      const { data: event, error: eventError } = await admin
        .from('payment_events')
        .insert({
          order_id: order.id,
          event_type: params.eventType,
          stripe_event_id: params.providerEventId,
          stripe_payment_intent_id: params.providerTransactionId,
          amount: params.amount,
          currency: params.currency ?? 'usd',
          raw_payload: { ...(params.rawPayload ?? {}), provider: params.provider },
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
          provider: params.provider,
          providerEventId: params.providerEventId,
          amount: params.amount,
        },
      });

      const paymentStatus = PAYMENT_STATUS_MAP[params.eventType];
      if (paymentStatus) {
        await admin
          .from('orders')
          .update({ payment_status: paymentStatus })
          .eq('id', order.id);
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
              providerTransactionId: params.providerTransactionId,
              amount: params.amount,
              eventType: params.eventType,
            },
          });

          // Member checkout credits (SPRR spent at checkout) stay on StreetPlayR.
          // Purchase XP/SPRR awards + referrals are owned by Nectar via
          // purchase.completed (OrderService → emitPurchaseCompleted). Do not
          // award locally here — that double-credits the same payment.
          const orderUserId: string | null = order.notes || null;

          if (orderUserId) {
            try {
              const creditsUsed = Math.floor(Number(order.discount_total ?? 0));
              if (creditsUsed > 0) {
                await redeemSPRR(orderUserId, creditsUsed, `Order credit ${order.id}`);
              }
            } catch (creditErr: unknown) {
              const creditMessage =
                creditErr instanceof Error ? creditErr.message : String(creditErr);
              await recordEvent({
                domain: 'payment',
                severity: 'error',
                action: 'payment.credit_redeem_failed',
                actorId: 'system',
                resourceType: 'orders',
                resourceId: order.id,
                message: `Checkout credit redeem failed for order ${order.id} (payment already confirmed): ${creditMessage}`,
                metadata: { orderId: order.id, eventType: params.eventType },
              });
            }
          } else {
            await recordEvent({
              domain: 'payment',
              severity: 'info',
              action: 'payment.nectar_identity_notes_empty',
              actorId: 'system',
              resourceType: 'orders',
              resourceId: order.id,
              message: `Order ${order.id} has empty orders.notes — purchase.completed identity resolves via customers.email → profiles (see PURCHASE_COMPLETED_CONTRACT).`,
              metadata: { orderId: order.id, eventType: params.eventType },
            });
          }

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

      if (
        params.eventType === 'charge.refunded' ||
        params.eventType === 'payment_intent.canceled'
      ) {
        const creditsUsed = Math.floor(Number(order.discount_total ?? 0));
        const refundUserId: string | null = order.notes || null;
        if (creditsUsed > 0 && refundUserId) {
          await refundSPRR(refundUserId, creditsUsed, `Order credit refund ${order.id}`);
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
      // Don't mark as failed on catch — allows the provider to retry the webhook
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
   * Check if a provider transaction (any gateway) was already processed
   * successfully. `transactionId` matches Stripe's PaymentIntent id or
   * Easebuzz's txnid — whichever was passed as providerTransactionId.
   */
  async isPaymentConfirmed(transactionId: string): Promise<boolean> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('payment_events')
        .select('id')
        .eq('stripe_payment_intent_id', transactionId) // physical column, see paymentEventFromDb
        .eq('event_type', 'payment_intent.succeeded')
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  },
};

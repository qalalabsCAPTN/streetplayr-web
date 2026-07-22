/**
 * Stripe Webhook Ingestion Handler
 *
 * Receives Stripe webhook events, verifies signatures, and routes
 * events to the PaymentService for processing.
 *
 * This is the ONLY Stripe-coupled file in the orchestration system.
 * All business logic lives in the payment/reservation/order services.
 *
 * Stripe is a thin payment rail — NOT the orchestration authority.
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PaymentService } from '@/lib/orchestration/payment';
import { ReservationService } from '@/lib/orchestration/reservation';
import { recordEvent } from '@/lib/orchestration/events';
import type { PaymentEventType } from '@/lib/orchestration/types';

/**
 * Verify Stripe webhook signature using the Stripe SDK.
 * Returns parsed event if valid, null if invalid.
 *
 * Production-safe: uses STRIPE_WEBHOOK_SECRET for verification.
 * Falls back to JSON parse ONLY if webhook secret is not configured
 * (for development environments).
 */
function verifySignature(
  payload: string,
  signature: string | null
): { type: string; id: string; data: Record<string, any> } | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secret && signature) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
        apiVersion: '2026-06-24.dahlia',
      });
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return {
        type: event.type,
        id: event.id,
        data: (event.data?.object as Record<string, any>) ?? {},
      };
    } catch (e: any) {
      console.error('[Webhook] Signature verification failed:', e.message);
      return null;
    }
  }

  // DEVELOPMENT ONLY: parse without verification
  if (!secret) {
    console.warn('[Webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    try {
      const parsed = JSON.parse(payload);
      return {
        type: parsed.type as string,
        id: parsed.id as string,
        data: parsed.data?.object ?? {},
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Map Stripe event types to our payment event taxonomy.
 */
const EVENT_TYPE_MAP: Record<string, PaymentEventType> = {
  'payment_intent.created': 'payment_intent.created',
  'payment_intent.processing': 'payment_intent.processing',
  'payment_intent.succeeded': 'payment_intent.succeeded',
  'payment_intent.payment_failed': 'payment_intent.payment_failed',
  'payment_intent.canceled': 'payment_intent.canceled',
  'payment_intent.expired': 'payment_intent.expired',
  'charge.refunded': 'charge.refunded',
  'charge.disputed': 'charge.disputed',
  'charge.refund.updated': 'charge.refund.updated',
};

/**
 * Map payment events to reservation transitions.
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

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    // Verify webhook signature
    const event = verifySignature(payload, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature or payload' },
        { status: 400 }
      );
    }

    const ourEventType = EVENT_TYPE_MAP[event.type];

    if (!ourEventType) {
      // Unknown event type — acknowledge but don't process
      return NextResponse.json({ received: true, ignored: true });
    }

    const paymentIntentId = event.data.id ?? event.data.object?.id;

    // Process payment event
    const result = await PaymentService.processWebhookEvent({
      eventType: ourEventType,
      stripeEventId: event.id,
      stripePaymentIntentId: paymentIntentId,
      amount: event.data.amount ?? event.data.object?.amount ?? 0,
      currency: event.data.currency ?? event.data.object?.currency,
      rawPayload: event.data,
    });

    if (!result.success && result.code === 'ORDER_NOT_FOUND') {
      // Fallback: try resolving order via Stripe PI metadata.order_id.
      // This handles the case where the PI was created with order context
      // but the PI-to-order link in our DB hasn't been committed yet.
      const metadataOrderId = event.data.metadata?.order_id ?? event.data.object?.metadata?.order_id;
      if (metadataOrderId && paymentIntentId) {
        // Link the PI to the order retroactively, then reprocess
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();

        await admin
          .from('orders')
          .update({ payment_intent_id: paymentIntentId })
          .eq('id', metadataOrderId)
          .eq('status', 'draft');

        // Retry processing
        const retry = await PaymentService.processWebhookEvent({
          eventType: ourEventType,
          stripeEventId: event.id,
          stripePaymentIntentId: paymentIntentId,
          amount: event.data.amount ?? event.data.object?.amount ?? 0,
          currency: event.data.currency ?? event.data.object?.currency,
          rawPayload: event.data,
        });

        if (retry.success) {
          await recordEvent({
            domain: 'payment',
            severity: 'info',
            action: 'webhook.order_resolved_via_metadata',
            actorId: 'system',
            resourceType: 'stripe_webhook',
            resourceId: event.id,
            message: `Order ${metadataOrderId} resolved via PI metadata — PI ${paymentIntentId} linked retroactively`,
            metadata: { orderId: metadataOrderId, paymentIntentId },
          });

          // Reservation transitions after successful reprocessing
          const reservationTransition = RESERVATION_TRANSITION_MAP[event.type];
          if (reservationTransition && retry.data) {
            const { data: reservations } = await admin
              .from('inventory_reservations')
              .select('id')
              .eq('order_id', metadataOrderId)
              .in('reservation_state', ['pending', 'held']);

            for (const res of reservations ?? []) {
              await reservationTransition(res.id, 'system');
            }
          }

          return NextResponse.json({ received: true, processed: true });
        }
      }

      // Still not found — reconciliation will handle it
      await recordEvent({
        domain: 'payment',
        severity: 'warning',
        action: 'webhook.order_not_found',
        actorId: 'system',
        resourceType: 'stripe_webhook',
        resourceId: event.id,
        message: `No order found for PaymentIntent ${paymentIntentId}. Reconciliation will handle.`,
        metadata: { eventType: event.type, stripeEventId: event.id },
      });

      return NextResponse.json({ received: true, reconciled: false });
    }

    if (!result.success && result.code !== 'ORDER_NOT_FOUND') {
      // Reservation transition failure already handled by PaymentService idempotency
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Reservation transitions handled inside PaymentService.processWebhookEvent
    // for idempotency coverage. No separate reservation transition needed here.

    return NextResponse.json({ received: true, processed: true });
  } catch (e: any) {
    console.error('[Webhook] Error processing webhook:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

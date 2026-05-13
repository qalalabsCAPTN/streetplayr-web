'use server';

import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

/**
 * Create a PaymentIntent for a specific order.
 *
 * The Stripe PI includes order_id as metadata so webhooks can
 * resolve the order even if the PI-to-order link in our DB hasn't
 * been committed yet (eliminates the race window between PI creation
 * and confirmCheckoutPaymentAction).
 */
export async function createPaymentIntentAction(
  amountInPaise: number,
  orderId?: string
): Promise<{ clientSecret: string; paymentIntentId: string } | { error: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'Payment service not configured.' };
  }
  if (amountInPaise < 100) {
    return { error: 'Order total is too low.' };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });

    const metadata: Record<string, string> = {};
    if (orderId) metadata.order_id = orderId;

    const intent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    if (!intent.client_secret) {
      return { error: 'Failed to initialise payment session.' };
    }

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  } catch (e: any) {
    return { error: e.message ?? 'Payment initialisation failed.' };
  }
}

/**
 * Combined: create Stripe PaymentIntent + link to order + hold reservations.
 *
 * This is the SAFE entry point — it eliminates the race window between
 * PI creation and order linking. The Stripe webhook may fire
 * payment_intent.created before this completes, but the PI already
 * carries order_id in metadata for webhook resolution.
 */
export async function createPaymentAndConfirmAction(
  orderId: string,
  amountInPaise: number
): Promise<OrchestrationResponse<{ clientSecret: string; paymentIntentId: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();

    // 1. Verify the order exists, is in draft, and belongs to this user
    const { data: order } = await admin
      .from('orders')
      .select('id, status, total')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (!order) return { success: false, error: 'Order not found.', code: 'ORDER_NOT_FOUND' };
    if (order.status !== 'draft') {
      return { success: false, error: 'Order is not in draft status.', code: 'INVALID_STATE' };
    }

    // 2. Create Stripe PaymentIntent with order context in metadata
    if (!process.env.STRIPE_SECRET_KEY) {
      return { success: false, error: 'Payment service not configured.', code: 'CONFIG_ERROR' };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });

    const intent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
      metadata: { order_id: orderId },
    });

    if (!intent.client_secret) {
      return { success: false, error: 'Failed to initialise payment session.', code: 'PI_CREATE_FAILED' };
    }

    // 3. Link PI to order and transition to pending_payment (atomic)
    const { data: updated, error: linkError } = await admin
      .from('orders')
      .update({
        status: 'pending_payment',
        payment_intent_id: intent.id,
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .select('id, status')
      .single();

    if (linkError || !updated) {
      // PI was created but linking failed — we have an orphaned PI.
      // This is a partial failure. The webhook handler and reconciliation
      // service will clean it up, but log it now for observability.
      await recordEvent({
        domain: 'payment',
        severity: 'error',
        action: 'payment.link_failed',
        actorId: user.id,
        resourceType: 'orders',
        resourceId: orderId,
        message: `PI ${intent.id} created but failed to link to order ${orderId}`,
        metadata: { paymentIntentId: intent.id, error: linkError?.message },
      });
      return { success: false, error: 'Failed to link payment to order.', code: 'LINK_FAILED' };
    }

    // 4. Transition linked reservations from pending → held
    await admin
      .from('inventory_reservations')
      .update({ reservation_state: 'held' })
      .eq('order_id', orderId)
      .eq('reservation_state', 'pending');

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'checkout.payment_confirmed',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: orderId,
      message: `Payment confirmed for order ${orderId} — PI ${intent.id}`,
      metadata: { paymentIntentId: intent.id },
    });

    return {
      success: true,
      data: { clientSecret: intent.client_secret, paymentIntentId: intent.id },
    };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'PAYMENT_ACTION_ERROR' };
  }
}

/**
 * Release reservations for a failed/cancelled payment.
 */
export async function releaseOrderReservationsAction(
  orderId: string
): Promise<OrchestrationResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();

    const { data: reservations } = await admin
      .from('inventory_reservations')
      .select('id')
      .eq('order_id', orderId)
      .in('reservation_state', ['pending', 'held']);

    if (!reservations || reservations.length === 0) {
      return { success: true };
    }

    for (const res of reservations) {
      await admin
        .from('inventory_reservations')
        .update({ reservation_state: 'released', released_at: new Date().toISOString() })
        .eq('id', res.id)
        .in('reservation_state', ['pending', 'held']);
    }

    await recordEvent({
      domain: 'reservation',
      severity: 'warning',
      action: 'reservation.released_batch',
      actorId: user.id,
      resourceType: 'inventory_reservations',
      resourceId: orderId,
      message: `Released ${reservations.length} reservations for order ${orderId} — payment failed`,
      metadata: { orderId, count: reservations.length },
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'RELEASE_ERROR' };
  }
}



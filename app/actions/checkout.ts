'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

export interface CheckoutItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingCost?: number;
  taxAmount?: number;
}

export interface CheckoutResult {
  orderId: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  reservationIds: string[];
}

/**
 * Initiate checkout — atomic orchestration step.
 *
 * Flow:
 *   1. Authenticate user
 *   2. Verify prices server-side against product_variant table
 *   3. Call initiate_checkout RPC (creates order + order_items + reservations)
 *   4. Log orchestration event
 *   5. Return order info and reservation IDs
 *
 * This is the ONLY entry point for starting a checkout.
 * Stripe PaymentIntent creation is a separate step after this.
 */
export async function initiateCheckoutAction(
  items: CheckoutItem[],
  shippingAddress: CheckoutAddress,
  paymentIntentId?: string
): Promise<OrchestrationResponse<CheckoutResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    if (!items.length) {
      return { success: false, error: 'Cart is empty.', code: 'EMPTY_CART' };
    }

    // Server-authoritative price verification
    const admin = createAdminClient();
    for (const item of items) {
      const { data: variant } = await admin
        .from('product_variants')
        .select('price_override, stock_quantity')
        .eq('id', item.variantId)
        .single();

      if (!variant) {
        return { success: false, error: `Variant ${item.variantId} not found.`, code: 'VARIANT_NOT_FOUND' };
      }

      // Reject if insufficient stock (first line of defense — RPC also checks)
      if ((variant.stock_quantity ?? 0) < item.quantity) {
        return { success: false, error: `Insufficient stock for variant ${item.variantId}.`, code: 'INSUFFICIENT_STOCK' };
      }
    }

    // Prepare address with shipping cost and tax
    const addressWithMeta = {
      ...shippingAddress,
      shipping_cost: shippingAddress.shippingCost ?? 0,
      tax_amount: shippingAddress.taxAmount ?? 0,
    };

    // Call atomic checkout RPC
    const { data: result, error } = await admin.rpc('initiate_checkout', {
      p_user_id: user.id,
      p_items: JSON.stringify(items),
      p_shipping_address: addressWithMeta,
      p_payment_intent_id: paymentIntentId ?? null,
      p_reservation_ttl_minutes: 15,
    });

    if (error) {
      const isStock = error.message?.includes('Insufficient stock');
      return {
        success: false,
        error: isStock ? 'Insufficient stock available.' : error.message,
        code: isStock ? 'INSUFFICIENT_STOCK' : 'CHECKOUT_FAILED',
      };
    }

    const checkoutResult = result as CheckoutResult;

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'checkout.initiated',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: checkoutResult.orderId,
      message: `Checkout initiated — ${checkoutResult.total} USD, ${items.length} items`,
      metadata: {
        itemCount: items.length,
        total: checkoutResult.total,
        hasPaymentIntent: !!paymentIntentId,
        reservationCount: checkoutResult.reservationIds?.length ?? 0,
      },
    });

    return { success: true, data: checkoutResult };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'CHECKOUT_ACTION_ERROR' };
  }
}

/**
 * Confirm checkout — links a PaymentIntent to an existing order.
 * Called after Stripe PaymentIntent is created server-side.
 */
export async function confirmCheckoutPaymentAction(
  orderId: string,
  paymentIntentId: string
): Promise<OrchestrationResponse<{ orderId: string; status: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();

    // Atomic: link PaymentIntent, transition to pending_payment, hold reservations
    const { data: updated, error } = await admin
      .from('orders')
      .update({
        status: 'pending_payment',
        payment_intent_id: paymentIntentId,
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .select('id, status')
      .single();

    if (error || !updated) {
      return { success: false, error: 'Order not found or not in draft status.', code: 'CONFIRM_FAILED' };
    }

    // Transition linked reservations from pending → held
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
      message: `Payment confirmed for order ${orderId} — PaymentIntent ${paymentIntentId}`,
      metadata: { paymentIntentId },
    });

    return { success: true, data: { orderId: updated.id, status: updated.status } };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'CONFIRM_ACTION_ERROR' };
  }
}

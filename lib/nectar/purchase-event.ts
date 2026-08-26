/**
 * purchase.completed emitter.
 *
 * See PURCHASE_COMPLETED_CONTRACT.md for the full envelope/payload spec.
 * Called exclusively from lib/orchestration/order.ts at the moment an
 * order transitions pending -> confirmed (the real "payment succeeded"
 * signal in this codebase — see order.ts for why that transition, not
 * the payment webhook itself, is the integration point).
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { buildEvent, emitEvent, type EmitEventResult } from './client';
import { recordEvent } from '@/lib/orchestration/events';

interface OrderRow {
  id: string;
  customer_id: string | null;
  grand_total: number | null;
  currency: string | null;
}

/**
 * Resolves the StreetPlayR profiles.id for an order's customer.
 *
 * The live schema has no direct FK from customers -> profiles (or
 * orders -> profiles) — the only linkage that exists is
 * profiles.email = customers.email (the same join OrderService.getForUser
 * already relies on). Returns null if no matching profile is found
 * (e.g. a guest checkout customer with no StreetPlayR account) — in
 * that case there is no ecosystem identity to credit, and the caller
 * should skip emitting the event rather than guess an id.
 */
async function resolveActorUserId(customerId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from('customers')
    .select('email')
    .eq('id', customerId)
    .single();

  if (!customer?.email) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', customer.email)
    .single();

  return profile?.id ?? null;
}

/**
 * True if this is the customer's first *confirmed* order (excluding
 * the one just being confirmed). Used for payload.isFirstOrder, which
 * NECTAR's "First Order Bonus" reward_rule conditions on
 * (payload.isFirstOrder eq true).
 */
async function isFirstOrder(customerId: string, currentOrderId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .neq('id', currentOrderId)
    .in('status', ['confirmed', 'processing', 'fulfilling', 'shipped', 'delivered']);

  return (count ?? 0) === 0;
}

export async function emitPurchaseCompleted(order: OrderRow): Promise<EmitEventResult | null> {
  if (!order.customer_id) {
    console.warn('[nectar] order has no customer_id — skipping purchase.completed', { orderId: order.id });
    return null;
  }

  const actorUserId = await resolveActorUserId(order.customer_id);
  if (!actorUserId) {
    console.warn('[nectar] no profiles row matches order customer email — skipping purchase.completed', {
      orderId: order.id,
      customerId: order.customer_id,
    });
    return null;
  }

  const firstOrder = await isFirstOrder(order.customer_id, order.id);

  // Reuse the order id as the NECTAR event id: makes re-emitting for the
  // same order (e.g. a retried transitionStatus call) land on NECTAR's
  // own PK-based dedup (events.id) instead of producing a second event.
  const event = buildEvent({
    eventType: 'purchase.completed',
    actorUserId,
    eventId: order.id,
    platformTraceId: order.id,
    payload: {
      orderId: order.id,
      orderTotal: order.grand_total ?? 0,
      currency: order.currency ?? 'INR',
      isFirstOrder: firstOrder,
      // Only one site is live today (see PLATFORM_ID_CONTRACT.md) — orders
      // carries no site_id column to read from, so this is the known
      // constant, not an invented per-order value.
      siteId: 'streetplayr',
    },
  });

  const result = await emitEvent(event);

  if (!result?.ok) {
    await recordEvent({
      domain: 'order',
      severity: 'error',
      action: 'nectar.purchase_completed_emit_failed',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: order.id,
      message: `purchase.completed emit failed for order ${order.id}: ${result?.error ?? 'unknown'}`,
      metadata: {
        orderId: order.id,
        eventId: event.eventId,
        actorUserId,
        error: result?.error ?? null,
        retryable: true,
      },
    });
  } else {
    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'nectar.purchase_completed_emitted',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: order.id,
      message: `purchase.completed emitted to Nectar for order ${order.id} (${result.status ?? 'ok'})`,
      metadata: {
        orderId: order.id,
        eventId: event.eventId,
        actorUserId,
        status: result.status ?? 'ok',
      },
    });
  }

  return result;
}

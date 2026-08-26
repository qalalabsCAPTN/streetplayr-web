'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { OrderService } from '@/lib/orchestration/order';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

/**
 * Dev-only checkout confirm. Disabled in production — UI gate is not enough.
 */
export async function confirmDemoOrderAction(
  orderId: string
): Promise<OrchestrationResponse<{ orderId: string }>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'Demo checkout is not available in production.',
        code: 'DEMO_DISABLED',
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, status, notes, customer_id')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: 'Order not found.', code: 'ORDER_NOT_FOUND' };
    }

    if (order.status !== 'pending') {
      return { success: false, error: 'Order is not payable.', code: 'ORDER_NOT_PAYABLE' };
    }

    const ownsByNotes = order.notes === user.id;
    let ownsByCustomer = false;
    if (order.customer_id) {
      const { data: customer } = await admin
        .from('customers')
        .select('email')
        .eq('id', order.customer_id)
        .maybeSingle();
      ownsByCustomer = Boolean(customer?.email && customer.email === user.email);
    }

    if (!ownsByNotes && !ownsByCustomer) {
      return { success: false, error: 'Not authorized for this order.', code: 'FORBIDDEN' };
    }

    const demoPaymentIntentId = `demo_${orderId.slice(0, 12)}`;

    const submitResult = await OrderService.submitForPayment(orderId, demoPaymentIntentId, user.id);
    if (!submitResult.success) {
      return { success: false, error: submitResult.error, code: submitResult.code };
    }

    await admin
      .from('inventory_reservations')
      .update({ reservation_state: 'held' })
      .eq('order_id', orderId)
      .eq('reservation_state', 'pending');

    await recordEvent({
      domain: 'order',
      severity: 'info',
      action: 'checkout.demo_completed',
      actorId: user.id,
      resourceType: 'orders',
      resourceId: orderId,
      message: `Demo order completed — ${orderId}`,
      metadata: { orderId, method: 'demo' },
    });

    return { success: true, data: { orderId } };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Demo checkout failed';
    return { success: false, error: message, code: 'DEMO_CHECKOUT_ERROR' };
  }
}

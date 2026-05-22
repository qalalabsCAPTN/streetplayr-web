'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { OrderService } from '@/lib/orchestration/order';
import { recordEvent } from '@/lib/orchestration/events';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

export async function confirmDemoOrderAction(
  orderId: string
): Promise<OrchestrationResponse<{ orderId: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();

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
  } catch (e: any) {
    return { success: false, error: e.message, code: 'DEMO_CHECKOUT_ERROR' };
  }
}

'use server';

import { OrderService } from '@/lib/orchestration/order';
import { createClient } from '@/lib/supabase/server';
import type { OrchestrationResponse, Order } from '@/lib/orchestration/types';

/**
 * Get orders for the current user.
 */
export async function getMyOrdersAction(): Promise<OrchestrationResponse<Order[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const orders = await OrderService.getForUser(user.id);
    return { success: true, data: orders };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'FETCH_ORDERS_ERROR' };
  }
}

/**
 * Get a single order by ID (must belong to current user).
 */
export async function getOrderAction(
  orderId: string
): Promise<OrchestrationResponse<Order>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const order = await OrderService.getById(orderId);
    if (!order) return { success: false, error: 'Order not found.', code: 'NOT_FOUND' };

    // Only the owner can read their own order
    if (order.userId !== user.id) {
      return { success: false, error: 'Not authorized.', code: 'FORBIDDEN' };
    }

    return { success: true, data: order };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'FETCH_ORDER_ERROR' };
  }
}

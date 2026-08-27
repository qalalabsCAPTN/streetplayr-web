'use server';

import { OrderService } from '@/lib/orchestration/order';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrchestrationResponse, Order } from '@/lib/orchestration/types';
import { sendTransactionalEmail, orderEmailHtml } from '@/lib/notifications/email';
import { rateLimit } from '@/lib/security/rate-limit';
import { isPayableOrder, ownsOrder } from '@/lib/commerce/order-paid';

export async function getMyOrdersAction(): Promise<OrchestrationResponse<Order[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const orders = await OrderService.getForUser(user.id);
    return { success: true, data: orders };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'fetch failed', code: 'FETCH_ORDERS_ERROR' };
  }
}

export async function getOrderAction(
  orderId: string
): Promise<OrchestrationResponse<Order>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const order = await OrderService.getById(orderId);
    if (!order) return { success: false, error: 'Order not found.', code: 'NOT_FOUND' };
    if (!ownsOrder(order, user.id, user.email)) {
      return { success: false, error: 'Not authorized.', code: 'FORBIDDEN' };
    }

    return { success: true, data: order };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'fetch failed', code: 'FETCH_ORDER_ERROR' };
  }
}

export async function cancelMyOrderAction(orderId: string): Promise<OrchestrationResponse<Order>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

  const rl = await rateLimit({ key: `cancel:${user.id}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return { success: false, error: 'Too many requests.', code: 'RATE_LIMITED' };

  const order = await OrderService.getById(orderId);
  if (!order || !ownsOrder(order, user.id, user.email)) {
    return { success: false, error: 'Not authorized.', code: 'FORBIDDEN' };
  }
  if (!['pending', 'confirmed'].includes(order.status)) {
    return { success: false, error: 'This order can no longer be cancelled.', code: 'INVALID_TRANSITION' };
  }

  const result = await OrderService.cancel(orderId, user.id, 'customer_cancel');
  if (result.success) {
    const email = (order.shippingAddress as { email?: string }).email || user.email;
    if (email) {
      await sendTransactionalEmail({
        to: email,
        template: 'cancellation',
        orderId,
        html: orderEmailHtml('Order cancelled', 'Your order was cancelled and stock was released.', order.orderNumber),
        text: `Order ${order.orderNumber} cancelled.`,
      });
    }
  }
  return result;
}

export async function requestReturnAction(orderId: string, reason: string): Promise<OrchestrationResponse<Order>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

  const order = await OrderService.getById(orderId);
  if (!order || !ownsOrder(order, user.id, user.email)) {
    return { success: false, error: 'Not authorized.', code: 'FORBIDDEN' };
  }
  if (!['shipped', 'delivered'].includes(order.status)) {
    return { success: false, error: 'Return is only available after shipment.', code: 'INVALID_TRANSITION' };
  }

  const result = await OrderService.transitionStatus(orderId, 'returned', user.id, reason || 'customer_return');
  if (result.success) {
    try {
      const { UnicommerceReturnService } = await import('@/src/integrations/unicommerce/returns');
      const { unicommerceShipTo } = await import('@/lib/commerce/address');
      const returns = new UnicommerceReturnService();
      const pickup = await returns.createReversePickup({
        saleOrderCode: order.orderNumber,
        reason: reason || 'customer_return',
        shippingAddress: unicommerceShipTo(order.shippingAddress),
        items: order.items.map((item) => ({
          saleOrderItemCode: item.id,
          sku: item.sku || 'UNKNOWN',
          quantity: item.quantity,
        })),
      });
      if (pickup.success && pickup.reversePickupCode) {
        const admin = createAdminClient();
        await admin
          .from('orders')
          .update({
            shipping_address: {
              ...(order.shippingAddress as Record<string, unknown>),
              reverse_pickup_code: pickup.reversePickupCode,
            },
          })
          .eq('id', orderId);
      }
    } catch {
      // Return is recorded locally even if UniCommerce is down; cron retries.
    }
    const email = (order.shippingAddress as { email?: string }).email || user.email;
    if (email) {
      await sendTransactionalEmail({
        to: email,
        template: 'return_update',
        orderId,
        html: orderEmailHtml('Return requested', reason || 'We received your return request.', order.orderNumber),
        text: `Return requested for ${order.orderNumber}`,
      });
    }
  }
  return result;
}

export async function requestExchangeAction(
  orderId: string,
  itemId: string,
  newVariantId: string,
  reason: string
): Promise<OrchestrationResponse<Order>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

  const order = await OrderService.getById(orderId);
  if (!order || !ownsOrder(order, user.id, user.email)) {
    return { success: false, error: 'Not authorized.', code: 'FORBIDDEN' };
  }
  if (!['shipped', 'delivered'].includes(order.status)) {
    return { success: false, error: 'Exchange is only available after shipment.', code: 'INVALID_TRANSITION' };
  }
  const item = order.items.find((i) => i.id === itemId);
  if (!item) return { success: false, error: 'Line item not found.', code: 'NOT_FOUND' };
  if (!newVariantId) return { success: false, error: 'Select a replacement size.', code: 'INVALID_VARIANT' };

  const annotated = `${reason || 'customer_exchange'} → ${newVariantId}`;
  const result = await requestReturnAction(orderId, annotated);
  if (result.success && result.data) {
    const admin = createAdminClient();
    await admin
      .from('orders')
      .update({
        shipping_address: {
          ...(result.data.shippingAddress as Record<string, unknown>),
          exchange_item_id: itemId,
          exchange_from_variant: item.variantId ?? '',
          exchange_to_variant: newVariantId,
        },
      })
      .eq('id', orderId);
  }
  return result;
}

export async function retryPaymentAction(
  orderId: string
): Promise<OrchestrationResponse<{ payable: boolean; status: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

  const order = await OrderService.getById(orderId);
  if (!order || !ownsOrder(order, user.id, user.email)) {
    return { success: false, error: 'Not authorized.', code: 'FORBIDDEN' };
  }
  if (!isPayableOrder(order)) {
    return { success: false, error: 'Order is not payable.', code: 'ORDER_NOT_PAYABLE' };
  }

  const { ReservationService } = await import('@/lib/orchestration/reservation');
  for (const item of order.items) {
    if (!item.variantId) {
      return { success: false, error: 'Order line is missing a variant.', code: 'VARIANT_NOT_FOUND' };
    }
    const reserved = await ReservationService.create(
      item.variantId,
      item.productId,
      item.quantity,
      user.id,
      'checkout_enter',
      15,
      orderId
    );
    if (!reserved.success) {
      return {
        success: false,
        error: reserved.error ?? 'Could not re-hold stock for retry.',
        code: reserved.code ?? 'INSUFFICIENT_STOCK',
      };
    }
  }

  return { success: true, data: { payable: true, status: order.status } };
}

export async function getExchangeOptionsAction(productId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('product_variants')
    .select('id, title, sku, attributes')
    .eq('product_id', productId);
  if (error) return { success: false as const, error: error.message };
  return {
    success: true as const,
    data: (data ?? []).map((v) => ({
      id: v.id as string,
      label: (v.attributes as { size?: string } | null)?.size || v.title || v.sku || v.id,
    })),
  };
}

export async function applyCouponQuoteAction(code: string, subtotal: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not authenticated.' };
  const { quoteCoupon } = await import('@/lib/commerce/coupons');
  return quoteCoupon({ code, subtotal, userId: user.id });
}

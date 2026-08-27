/**
 * Forward a paid StreetPlayR order to Uniware.
 * Used by payment webhooks, checkout success, reconciliation, and ops retry.
 * Never throws to the customer path — callers log and continue.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { recordEvent } from '@/lib/orchestration/events';
import { UnicommerceService, UnicommerceLogger } from '@/src/integrations/unicommerce';
import { getUnicommerceConfig, isUnicommerceLiveConfigured } from '@/src/integrations/unicommerce/config';
import { unicommerceShipTo } from '@/lib/commerce/address';

const PAID_STATUS = new Set(['confirmed', 'processing', 'fulfilling', 'shipped', 'delivered']);

export type UniwareForwardResult = {
  ok: boolean;
  skipped?: boolean;
  uniwareCode?: string;
  error?: string;
};

export async function forwardPaidOrderToUnicommerce(orderId: string): Promise<UniwareForwardResult> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select(
      'id, order_number, status, payment_status, shipping_address, billing_address, currency, created_at, source_order_id, grand_total'
    )
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return { ok: false, error: 'ORDER_NOT_FOUND' };

  if (order.source_order_id) {
    return { ok: true, skipped: true, uniwareCode: order.source_order_id };
  }

  const paid =
    String(order.payment_status ?? '').toLowerCase() === 'paid'
    || PAID_STATUS.has(String(order.status ?? ''));
  if (!paid) return { ok: false, error: 'NOT_PAID' };

  const config = getUnicommerceConfig();
  if (!config.isDemoMode && !isUnicommerceLiveConfigured(config)) {
    const error = 'UNICOMMERCE_API_URL missing or invalid';
    await UnicommerceLogger.error(
      'orders.forward_config_missing',
      `Skip Uniware forward for ${order.order_number}: ${error}`,
      new Error(error),
      order.id
    );
    return { ok: false, error };
  }

  const { data: orderItems } = await admin
    .from('order_items')
    .select('sku, quantity, unit_price, product_title, variant_title, variant_id')
    .eq('order_id', order.id);

  if (!orderItems?.length) return { ok: false, error: 'NO_ORDER_ITEMS' };

  const channelCode = process.env.UNICOMMERCE_CHANNEL_CODE || 'CUSTOM';
  const shippingAddr = unicommerceShipTo(order.shipping_address);
  const billingAddr = unicommerceShipTo(order.billing_address || order.shipping_address);

  const ucResult = await UnicommerceService.orders.createOrder(
    {
      id: order.id,
      displayCode: order.order_number || order.id.slice(0, 12).toUpperCase(),
      createdAt: order.created_at,
      currency: order.currency || 'INR',
      paymentMethod: 'PREPAID',
      shippingAddress: shippingAddr,
      billingAddress: billingAddr,
      grandTotal: Number(order.grand_total ?? 0),
      items: orderItems.map((item) => ({
        sku: item.sku || '',
        name: item.variant_title || item.product_title || '',
        price: Number(item.unit_price ?? 0),
        quantity: Number(item.quantity ?? 1),
      })),
    },
    channelCode
  );

  if (ucResult.success && ucResult.uniwareCode) {
    await admin.from('orders').update({ source_order_id: ucResult.uniwareCode }).eq('id', order.id);
    await recordEvent({
      domain: 'fulfillment',
      severity: 'info',
      action: 'unicommerce.forward_success',
      actorId: 'system',
      resourceType: 'orders',
      resourceId: order.id,
      message: `Order ${order.order_number} forwarded to Uniware as ${ucResult.uniwareCode}`,
      metadata: { uniwareCode: ucResult.uniwareCode, duplicate: Boolean(ucResult.isDuplicate) },
    });
    return { ok: true, uniwareCode: ucResult.uniwareCode, skipped: Boolean(ucResult.isDuplicate) };
  }

  await UnicommerceLogger.error(
    'payment.unicommerce_forward_failed',
    `Failed to forward order ${order.id} to Unicommerce`,
    new Error(ucResult.error || 'createOrder failed'),
    order.id
  );
  return { ok: false, error: ucResult.error || 'createOrder failed' };
}

export async function forwardUnpushedPaidOrders(limit = 20): Promise<{
  attempted: number;
  forwarded: string[];
  failed: string[];
}> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('orders')
    .select('id')
    .eq('payment_status', 'paid')
    .is('source_order_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  const forwarded: string[] = [];
  const failed: string[] = [];
  for (const row of rows ?? []) {
    const result = await forwardPaidOrderToUnicommerce(row.id);
    if (result.ok) forwarded.push(row.id);
    else failed.push(row.id);
  }
  return { attempted: (rows ?? []).length, forwarded, failed };
}

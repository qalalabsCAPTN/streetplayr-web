import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UnicommerceOrderService } from '@/src/integrations/unicommerce/orders';
import { UnicommerceShipmentService } from '@/src/integrations/unicommerce/shipments';
import { UnicommerceLogger } from '@/src/integrations/unicommerce/logging';
import { OrderService } from '@/lib/orchestration/order';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';

/**
 * Unicommerce → Supabase Order Status mapping.
 * Maps Unicommerce order/item status codes to our internal order states.
 */
const UC_STATUS_MAP: Record<string, string> = {
  'CREATED': 'confirmed',
  'PROCESSING': 'processing',
  'PARTIALLY_SHIPPED': 'processing',
  'SHIPPED': 'shipped',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
  'RETURN_EXPECTED': 'shipped', // Still shipped, return in progress
  'RETURNED': 'refunded',
  'COMPLETE': 'delivered',
  'UNFULFILLABLE': 'cancelled',
};

/**
 * Cron: Order Status Synchronization
 *
 * Every 5 minutes. Polls Unicommerce for status updates on all active orders.
 * Updates local order status and stores shipment tracking metadata.
 *
 * Idempotent: Uses a 5-minute window key.
 * Auth: Requires CRON_SECRET Bearer token.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Lock-safe: use idempotency key for this 5-minute window
  const windowKey = `cron:sync-order-status:${Math.floor(Date.now() / 300000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 600 });

  if (!guard.canProceed) {
    return NextResponse.json({
      skipped: true,
      reason: 'Already processed in this cron window',
    });
  }

  const startTime = Date.now();
  let statusUpdated = 0;
  let trackingUpdated = 0;
  let errors = 0;
  let ordersChecked = 0;

  try {
    const admin = createAdminClient();
    const orderService = new UnicommerceOrderService();
    const shipmentService = new UnicommerceShipmentService();

    // Fetch all active orders (not terminal states) that have a Unicommerce code
    const { data: activeOrders, error: fetchError } = await admin
      .from('orders')
      .select('id, status, metadata')
      .in('status', ['confirmed', 'processing', 'shipped'])
      .not('metadata->uniwareCode', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch active orders: ${fetchError.message}`);
    }

    if (!activeOrders || activeOrders.length === 0) {
      await guard.complete({ ordersChecked: 0, statusUpdated: 0 });
      return NextResponse.json({
        processed: true,
        ordersChecked: 0,
        statusUpdated: 0,
        trackingUpdated: 0,
        errors: 0,
        durationMs: Date.now() - startTime,
      });
    }

    for (const order of activeOrders) {
      try {
        ordersChecked++;
        const meta = (order.metadata as Record<string, any>) || {};
        const uniwareCode = meta.uniwareCode as string;

        if (!uniwareCode) continue;

        // 1. Fetch order status from Unicommerce
        const ucOrder = await orderService.getOrder(uniwareCode);
        if (!ucOrder) continue;

        // 2. Map UC status to local status
        const mappedStatus = ucOrder.status ? UC_STATUS_MAP[ucOrder.status as string] : undefined;
        if (mappedStatus && mappedStatus !== order.status) {
          const transition = await OrderService.transitionStatus(
            order.id,
            mappedStatus,
            'system',
            `unicommerce_status_sync:${ucOrder.status}`
          );

          if (transition.success) {
            statusUpdated++;
            await UnicommerceLogger.info(
              'cron.order_status_updated',
              `Order ${order.id} status updated: ${order.status} → ${mappedStatus} (UC: ${ucOrder.status})`,
              order.id,
              { fromStatus: order.status, toStatus: mappedStatus, ucStatus: ucOrder.status }
            );
          }
        }

        // 3. Fetch shipment tracking for shipped orders
        if (ucOrder.status === 'SHIPPED' || ucOrder.status === 'DELIVERED' || ucOrder.status === 'PARTIALLY_SHIPPED') {
          const shipments = await shipmentService.getShipmentsByOrder(uniwareCode);

          if (shipments.length > 0) {
            const primaryShipment = shipments[0];
            const trackingMeta = {
              ...meta,
              tracking: {
                courierName: primaryShipment.courierName,
                trackingNumber: primaryShipment.trackingNumber,
                waybillNumber: primaryShipment.waybillNumber,
                shippingPackageCode: primaryShipment.shippingPackageCode,
                shipmentStatus: primaryShipment.status,
                dispatchedAt: primaryShipment.dispatchedAt,
                deliveredAt: primaryShipment.deliveredAt,
                lastSyncedAt: new Date().toISOString(),
              },
            };

            // Only update if tracking info changed
            const prevTracking = meta.tracking as Record<string, any> | undefined;
            if (!prevTracking || prevTracking.trackingNumber !== primaryShipment.trackingNumber ||
                prevTracking.shipmentStatus !== primaryShipment.status) {
              await admin
                .from('orders')
                .update({ metadata: trackingMeta })
                .eq('id', order.id);
              trackingUpdated++;
            }
          }
        }
      } catch (err: any) {
        errors++;
        await UnicommerceLogger.error(
          'cron.order_status_item_failed',
          `Failed syncing status for order ${order.id}`,
          err,
          order.id
        );
      }
    }

    const durationMs = Date.now() - startTime;

    await UnicommerceLogger.info(
      'cron.sync_order_status_complete',
      `Order status sync completed in ${durationMs}ms. Checked: ${ordersChecked}, Updated: ${statusUpdated}, Tracking: ${trackingUpdated}, Errors: ${errors}`,
      'cron',
      { durationMs, ordersChecked, statusUpdated, trackingUpdated, errors }
    );

    await guard.complete({ ordersChecked, statusUpdated, trackingUpdated, errors });

    return NextResponse.json({
      processed: true,
      ordersChecked,
      statusUpdated,
      trackingUpdated,
      errors,
      durationMs,
    });
  } catch (e: any) {
    const durationMs = Date.now() - startTime;

    await UnicommerceLogger.error(
      'cron.sync_order_status_failed',
      'Order status sync cron job failed',
      e,
      'cron',
      { durationMs }
    );

    await guard.fail(e.message);

    return NextResponse.json(
      { error: e.message ?? 'Order status sync failed', durationMs },
      { status: 500 }
    );
  }
}

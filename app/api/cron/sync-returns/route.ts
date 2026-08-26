import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UnicommerceLogger } from '@/src/integrations/unicommerce';
import { UnicommerceReturnService } from '@/src/integrations/unicommerce/returns';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';
import { unicommerceShipTo } from '@/lib/commerce/address';

/**
 * Cron: create UniCommerce reverse pickups for returned orders that
 * have not yet been synced. Idempotent on shipping_address.reverse_pickup_code.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const windowKey = `cron:sync-returns:${Math.floor(Date.now() / 600000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 1200 });

  if (!guard.canProceed) {
    return NextResponse.json({ skipped: true, reason: 'Already processed in this cron window' });
  }

  const startTime = Date.now();

  try {
    const admin = createAdminClient();
    const { data: orders, error } = await admin
      .from('orders')
      .select('id, order_number, source_order_id, shipping_address, status')
      .in('status', ['returned', 'refunded'])
      .limit(50);

    if (error) throw new Error(error.message);

    const orderIds = (orders ?? []).map((o) => o.id);
    const { data: itemRows } = orderIds.length
      ? await admin.from('order_items').select('order_id, sku, quantity, id').in('order_id', orderIds)
      : { data: [] as { order_id: string; sku: string | null; quantity: number; id: string }[] };

    const returns = new UnicommerceReturnService();
    let created = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const order of orders ?? []) {
      const ship = (order.shipping_address ?? {}) as Record<string, unknown>;
      if (ship.reverse_pickup_code) {
        skipped += 1;
        continue;
      }
      const saleOrderCode = order.source_order_id || order.order_number;
      if (!saleOrderCode) {
        skipped += 1;
        continue;
      }
      const result = await returns.createReversePickup({
        saleOrderCode,
        reason: 'customer_return',
        shippingAddress: unicommerceShipTo(ship),
        items: (itemRows ?? [])
          .filter((row) => row.order_id === order.id)
          .map((row) => ({
            saleOrderItemCode: row.id,
            sku: row.sku || 'UNKNOWN',
            quantity: row.quantity,
          })),
      });
      if (!result.success || !result.reversePickupCode) {
        failures.push(order.id);
        continue;
      }
      await admin
        .from('orders')
        .update({
          shipping_address: { ...ship, reverse_pickup_code: result.reversePickupCode },
        })
        .eq('id', order.id);
      created += 1;
    }

    const durationMs = Date.now() - startTime;
    await UnicommerceLogger.info(
      'cron.sync_returns_complete',
      `Returns sync created=${created} skipped=${skipped} failed=${failures.length} in ${durationMs}ms`,
      'cron',
      { durationMs, created, skipped, failures }
    );
    await guard.complete({ created, skipped, failures });

    return NextResponse.json({ processed: true, created, skipped, failures, durationMs });
  } catch (e: any) {
    const durationMs = Date.now() - startTime;
    await UnicommerceLogger.error('cron.sync_returns_failed', 'Returns sync cron job failed', e, 'cron', {
      durationMs,
    });
    await guard.fail(e.message);
    return NextResponse.json({ error: e.message ?? 'Returns sync failed', durationMs }, { status: 500 });
  }
}

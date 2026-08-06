import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UnicommerceLogger } from '@/src/integrations/unicommerce/logging';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';

/**
 * Cron: Returns Synchronization (Placeholder)
 *
 * Every 10 minutes. Checks for orders in refunded/returned states
 * and synchronizes return details from Unicommerce.
 *
 * Currently logs active return counts. Full implementation will
 * query UnicommerceReturnService for reverse pickup updates.
 *
 * Idempotent: Uses a 10-minute window key.
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

  // Lock-safe: use idempotency key for this 10-minute window
  const windowKey = `cron:sync-returns:${Math.floor(Date.now() / 600000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 1200 });

  if (!guard.canProceed) {
    return NextResponse.json({
      skipped: true,
      reason: 'Already processed in this cron window',
    });
  }

  const startTime = Date.now();

  try {
    const admin = createAdminClient();

    // Count orders eligible for return processing
    const { count, error } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['refunded']);

    if (error) {
      throw new Error(`Failed to count returnable orders: ${error.message}`);
    }

    const durationMs = Date.now() - startTime;

    await UnicommerceLogger.info(
      'cron.sync_returns_complete',
      `Returns sync cron completed in ${durationMs}ms. Returnable orders: ${count ?? 0}`,
      'cron',
      { durationMs, returnableOrders: count ?? 0 }
    );

    await guard.complete({ returnableOrders: count ?? 0 });

    return NextResponse.json({
      processed: true,
      returnableOrders: count ?? 0,
      durationMs,
    });
  } catch (e: any) {
    const durationMs = Date.now() - startTime;

    await UnicommerceLogger.error(
      'cron.sync_returns_failed',
      'Returns sync cron job failed',
      e,
      'cron',
      { durationMs }
    );

    await guard.fail(e.message);

    return NextResponse.json(
      { error: e.message ?? 'Returns sync failed', durationMs },
      { status: 500 }
    );
  }
}

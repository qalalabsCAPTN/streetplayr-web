import { NextResponse } from 'next/server';
import { UnicommerceSyncService } from '@/src/integrations/unicommerce/sync';
import { UnicommerceLogger } from '@/src/integrations/unicommerce/logging';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';

/**
 * Cron: Product Catalog Synchronization
 *
 * Every 5 minutes. Fetches all products from Unicommerce,
 * filters to playR STREET brand, upserts into Supabase.
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
  const windowKey = `cron:sync-products:${Math.floor(Date.now() / 300000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 600 });

  if (!guard.canProceed) {
    return NextResponse.json({
      skipped: true,
      reason: 'Already processed in this cron window',
    });
  }

  const startTime = Date.now();

  try {
    const syncService = new UnicommerceSyncService();
    const result = await syncService.syncProducts();
    const durationMs = Date.now() - startTime;

    await UnicommerceLogger.info(
      'cron.sync_products_complete',
      `Product sync cron completed in ${durationMs}ms. Processed: ${result.processed}, Errors: ${result.errors}`,
      'cron',
      { durationMs, ...result }
    );

    await guard.complete(result);

    return NextResponse.json({
      processed: true,
      success: result.success,
      productsProcessed: result.processed,
      errors: result.errors,
      durationMs,
    });
  } catch (e: any) {
    const durationMs = Date.now() - startTime;

    await UnicommerceLogger.error(
      'cron.sync_products_failed',
      'Product sync cron job failed',
      e,
      'cron',
      { durationMs }
    );

    await guard.fail(e.message);

    return NextResponse.json(
      { error: e.message ?? 'Product sync failed', durationMs },
      { status: 500 }
    );
  }
}

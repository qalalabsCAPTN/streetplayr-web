import { NextResponse } from 'next/server';
import { ReconciliationService } from '@/lib/orchestration/reconciliation';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';

/**
 * Cron: Reconciliation Cycle
 *
 * Every 15 minutes. Detects and resolves:
 *   - Orphaned payments (orders stuck pending with confirmed Easebuzz payment)
 *   - Stale reservations (reservations held > 2h with no order activity)
 *
 * Idempotent: Auto-confirms are guarded by OrderService.transitionStatus
 * (only succeeds if order is in valid source state).
 *
 * Lock-safe: Uses idempotency key for the 15-minute window.
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

  // Lock-safe: use idempotency key for this 15-minute window
  const windowKey = `cron:reconciliation:${Math.floor(Date.now() / 900000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 1800 });

  if (!guard.canProceed) {
    return NextResponse.json({
      skipped: true,
      reason: 'Already processed in this cron window',
    });
  }

  try {
    const result = await ReconciliationService.runFullCycle();
    await guard.complete(result);

    return NextResponse.json({
      processed: true,
      ordersConfirmed: result.ordersConfirmed.length,
      staleReservationsReleased: result.staleReservationsReleased,
      uniwareForwarded: result.uniwareForwarded?.length ?? 0,
    });
  } catch (e: any) {
    await guard.fail(e.message);
    return NextResponse.json(
      { error: e.message ?? 'Reconciliation cycle failed' },
      { status: 500 }
    );
  }
}

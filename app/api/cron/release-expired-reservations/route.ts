import { NextResponse } from 'next/server';
import { ReservationService } from '@/lib/orchestration/reservation';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';

/**
 * Cron: Release Expired Reservations
 *
 * Every 5 minutes. Releases reservations whose TTL has expired.
 *
 * Idempotent: Running multiple times within the same cron window
 * is safe — already-expired reservations are skipped.
 *
 * Lock-safe: Uses idempotency key for the cron window.
 * If a previous run is still processing, subsequent runs are skipped.
 */
export async function GET(request: Request) {
  // Verify cron secret
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
  const windowKey = `cron:release-expired:${Math.floor(Date.now() / 300000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 600 });

  if (!guard.canProceed) {
    return NextResponse.json({
      skipped: true,
      reason: 'Already processed in this cron window',
    });
  }

  try {
    const result = await ReservationService.releaseExpired();
    await guard.complete(result);

    return NextResponse.json({
      processed: true,
      released: result.data?.released ?? 0,
    });
  } catch (e: any) {
    await guard.fail(e.message);
    return NextResponse.json(
      { error: e.message ?? 'Release expired reservations failed' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';
import { syncSprrBalanceFromNectar } from '@/lib/nectar/balance';
import { recordEvent } from '@/lib/orchestration/events';

/**
 * Cron: sync profiles.sprr_balance from Nectar wallet_balances.
 *
 * Catches async reward grants after purchase.completed and heals drift.
 * Schedule: every 5–15 minutes (Vercel cron or external scheduler).
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

  const windowKey = `cron:wallet-sync:${Math.floor(Date.now() / 300000)}`;
  const guard = await idempotencyGuard(windowKey, { ttl: 600 });

  if (!guard.canProceed) {
    return NextResponse.json({ skipped: true, reason: 'Already processed in this cron window' });
  }

  try {
    const admin = createAdminClient();
    const { data: wallets, error } = await admin
      .from('wallet_accounts')
      .select('user_id')
      .in('wallet_type', ['points', 'credits'])
      .limit(500);

    if (error) {
      await guard.fail(error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((wallets ?? []).map((w: { user_id: string }) => w.user_id))];
    let synced = 0;
    let unchanged = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        const result = await syncSprrBalanceFromNectar(userId);
        if (result.synced) synced += 1;
        else unchanged += 1;
      } catch (e: unknown) {
        errors.push(`${userId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const summary = { usersScanned: userIds.length, synced, unchanged, errors: errors.length };
    await recordEvent({
      domain: 'system',
      severity: errors.length ? 'warning' : 'info',
      action: 'nectar.cron_wallet_sync',
      actorId: 'system',
      resourceType: 'cron',
      resourceId: windowKey,
      message: `Wallet sync cron: ${synced} synced, ${unchanged} unchanged, ${errors.length} errors`,
      metadata: summary,
    });

    await guard.complete(summary);
    return NextResponse.json({ processed: true, ...summary });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Wallet sync failed';
    await guard.fail(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

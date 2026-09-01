import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { syncSprrBalanceFromNectar } from '@/lib/nectar/balance';
import { recordEvent } from '@/lib/orchestration/events';

/**
 * Inbound Nectar webhook — wallet balance updates after reward processing.
 *
 * Expects the same HMAC envelope as outbound POST /v1/events:
 *   X-Nectar-Platform, X-Nectar-Token, X-Nectar-Signature (sha256=<hex>)
 *
 * Handled event types:
 *   - wallet.credited
 *   - wallet.updated
 *   - reward.granted
 */
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret =
    process.env.NECTAR_SIGNING_SECRET ?? process.env.PLATFORM_TOKEN_STREETPLAYR ?? '';
  if (!secret || !signatureHeader) return false;

  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const WALLET_SYNC_EVENTS = new Set([
  'wallet.credited',
  'wallet.updated',
  'reward.granted',
  'purchase.completed',
]);

export async function POST(request: Request) {
  const token = request.headers.get('x-nectar-token');
  const platform = request.headers.get('x-nectar-platform');
  const expectedToken =
    process.env.NECTAR_SIGNING_SECRET ?? process.env.PLATFORM_TOKEN_STREETPLAYR ?? '';

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (platform && platform !== 'streetplayr' && platform !== 'nectar-internal') {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-nectar-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: {
    eventType?: string;
    actorUserId?: string;
    payload?: { userId?: string; actorUserId?: string };
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = body.eventType ?? '';
  if (!WALLET_SYNC_EVENTS.has(eventType)) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'event_type_ignored' });
  }

  const userId =
    body.actorUserId ??
    body.payload?.userId ??
    body.payload?.actorUserId;

  if (!userId) {
    return NextResponse.json({ error: 'Missing actorUserId' }, { status: 400 });
  }

  const result = await syncSprrBalanceFromNectar(userId);

  await recordEvent({
    domain: 'system',
    severity: 'info',
    action: 'nectar.webhook_balance_sync',
    actorId: 'system',
    resourceType: 'profiles',
    resourceId: userId,
    message: `Nectar webhook ${eventType} synced balance to ${result.balance}`,
    metadata: { eventType, userId, ...result },
  });

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    source: result.source,
    synced: result.synced,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { isSentryEnabled } from '@/lib/monitoring/sentry-options';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const query = req.nextUrl.searchParams.get('secret') || '';
  return bearer === secret || query === secret;
}

/**
 * Controlled verification. Does not claim Sentry is active unless DSN exists
 * and the SDK accepts the event. Requires CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSentryEnabled()) {
    return NextResponse.json({
      captured: false,
      reason: 'SENTRY_DSN missing — SDK disabled',
    });
  }

  const eventId = Sentry.captureException(
    new Error('StreetPlayR Sentry verification — delete if this appears in production unexpectedly')
  );
  await Sentry.flush(2000);

  return NextResponse.json({
    captured: Boolean(eventId),
    eventId: eventId || null,
  });
}

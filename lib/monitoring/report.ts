import * as Sentry from '@sentry/nextjs';
import { isSentryEnabled } from '@/lib/monitoring/sentry-options';

/**
 * Error reporting. Uses official Sentry SDK when DSN is set; always logs.
 * Never throws into the commerce path. Never claims ingest without a DSN.
 */
export async function reportError(message: string, extra?: Record<string, unknown>): Promise<void> {
  console.error('[monitor]', message, extra ?? {});
  if (!isSentryEnabled()) return;

  try {
    Sentry.captureException(new Error(message), { extra: extra ?? {} });
  } catch (err) {
    console.error('[monitor] sentry capture failed', err);
  }
}

import { isSentryEnabled } from '@/lib/monitoring/sentry-options';

export { isSentryEnabled };

/**
 * Official SDK boots from sentry.server.config.ts via instrumentation.ts.
 * This helper only reports whether a DSN is present — never claims ingest.
 */
export function sentryStatus(): { enabled: boolean } {
  return { enabled: isSentryEnabled() };
}

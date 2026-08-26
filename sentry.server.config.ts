import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent, sentryRuntimeOptions } from '@/lib/monitoring/sentry-options';

Sentry.init({
  ...sentryRuntimeOptions(),
  beforeSend: scrubSentryEvent,
  beforeSendTransaction(event) {
    if (event.transaction?.includes('/api/health')) return null;
    return event;
  },
});

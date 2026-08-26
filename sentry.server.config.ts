import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent, sentryRuntimeOptions } from '@/lib/monitoring/sentry-options';

Sentry.init({
  ...sentryRuntimeOptions(),
  beforeSend: scrubSentryEvent,
});

import type { ErrorEvent, EventHint } from '@sentry/nextjs';

const SECRET_KEY = /password|secret|salt|token|authorization|cookie|dsn|api[_-]?key/i;

export function resolveSentryDsn(): string | undefined {
  const dsn = (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '').trim();
  return dsn || undefined;
}

export function isSentryEnabled(): boolean {
  return Boolean(resolveSentryDsn());
}

export function sentryRuntimeOptions() {
  const dsn = resolveSentryDsn();
  return {
    dsn,
    enabled: Boolean(dsn),
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  };
}

export function scrubSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.user) {
    event.user = { id: event.user.id };
  }
  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    for (const key of Object.keys(headers)) {
      if (SECRET_KEY.test(key)) headers[key] = '[filtered]';
    }
    event.request.headers = headers;
  }
  if (event.extra) {
    const extra: Record<string, unknown> = { ...event.extra };
    for (const key of Object.keys(extra)) {
      if (SECRET_KEY.test(key)) extra[key] = '[filtered]';
    }
    event.extra = extra;
  }
  return event;
}

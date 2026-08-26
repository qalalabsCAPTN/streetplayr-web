import { afterEach, describe, expect, it } from 'vitest';
import { isSentryEnabled, resolveSentryDsn, scrubSentryEvent, sentryRuntimeOptions } from './sentry-options';
import type { ErrorEvent } from '@sentry/nextjs';

const KEYS = ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN'] as const;
const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('Sentry init with/without DSN', () => {
  it('disables SDK when DSN is missing', () => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    expect(resolveSentryDsn()).toBeUndefined();
    expect(isSentryEnabled()).toBe(false);
    expect(sentryRuntimeOptions().enabled).toBe(false);
    expect(sentryRuntimeOptions().dsn).toBeUndefined();
  });

  it('enables SDK when SENTRY_DSN is set', () => {
    for (const k of KEYS) saved[k] = process.env[k];
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.SENTRY_DSN = 'https://abc@o1.ingest.sentry.io/1';
    expect(isSentryEnabled()).toBe(true);
    expect(sentryRuntimeOptions().enabled).toBe(true);
    expect(sentryRuntimeOptions().dsn).toBe('https://abc@o1.ingest.sentry.io/1');
  });

  it('scrubs secret-like extra keys', () => {
    const event = {
      extra: { SMTP_PASSWORD: 'secret', orderId: 'SP-1' },
      user: { id: 'u1', email: 'a@b.c' },
    } as unknown as ErrorEvent;
    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed?.extra?.SMTP_PASSWORD).toBe('[filtered]');
    expect(scrubbed?.extra?.orderId).toBe('SP-1');
    expect(scrubbed?.user).toEqual({ id: 'u1' });
  });
});

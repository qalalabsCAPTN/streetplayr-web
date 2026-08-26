import { describe, expect, it, afterEach } from 'vitest';
import { launchEnvPresence } from './validate';

const KEYS = [
  'CRON_SECRET',
  'EASEBUZZ_MERCHANT_KEY',
  'EASEBUZZ_SALT',
  'EASEBUZZ_ENV',
  'RESEND_API_KEY',
  'TRANSACTIONAL_FROM_EMAIL',
  'SENTRY_DSN',
] as const;

const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('launchEnvPresence', () => {
  it('reports MISSING when unset', () => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    const r = launchEnvPresence();
    expect(r.vars.CRON_SECRET).toBe('MISSING');
    expect(r.vars.RESEND_API_KEY).toBe('MISSING');
    expect(r.easebuzzEnv).toBe('MISSING');
  });

  it('reports prod when EASEBUZZ_ENV=prod', () => {
    for (const k of KEYS) saved[k] = process.env[k];
    process.env.EASEBUZZ_ENV = 'prod';
    process.env.CRON_SECRET = 'x';
    process.env.EASEBUZZ_MERCHANT_KEY = 'k';
    process.env.EASEBUZZ_SALT = 's';
    process.env.RESEND_API_KEY = 're_x';
    process.env.TRANSACTIONAL_FROM_EMAIL = 'StreetPlayR <orders@playR.in>';
    process.env.SENTRY_DSN = 'https://abc@o1.ingest.sentry.io/1';
    const r = launchEnvPresence();
    expect(r.easebuzzEnv).toBe('prod');
    expect(Object.values(r.vars).every((v) => v === 'SET')).toBe(true);
  });
});

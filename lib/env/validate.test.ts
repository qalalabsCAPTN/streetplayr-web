import { describe, expect, it, afterEach } from 'vitest';
import { launchEnvPresence } from './validate';

const KEYS = [
  'EASEBUZZ_MERCHANT_KEY',
  'EASEBUZZ_SALT',
  'EASEBUZZ_ENV',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
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
    expect(r.vars.SMTP).toBe('MISSING');
    expect(r.vars.SENTRY_DSN).toBe('MISSING');
    expect(r.easebuzzEnv).toBe('MISSING');
  });

  it('reports prod when EASEBUZZ_ENV=prod', () => {
    for (const k of KEYS) saved[k] = process.env[k];
    process.env.EASEBUZZ_ENV = 'prod';
    process.env.EASEBUZZ_MERCHANT_KEY = 'k';
    process.env.EASEBUZZ_SALT = 's';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASSWORD = 'p';
    process.env.TRANSACTIONAL_FROM_EMAIL = 'StreetPlayR <orders@playR.in>';
    process.env.SENTRY_DSN = 'https://abc@o1.ingest.sentry.io/1';
    const r = launchEnvPresence();
    expect(r.easebuzzEnv).toBe('prod');
    expect(r.vars.SMTP).toBe('SET');
    expect(r.vars.SENTRY_DSN).toBe('SET');
  });
});

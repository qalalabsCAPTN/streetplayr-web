import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSmtpConfig } from './smtp';
import { __setMailerForTests, sendTransactionalEmail } from './email';

const KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'TRANSACTIONAL_FROM_EMAIL',
] as const;

const saved: Record<string, string | undefined> = {};

function snapshotEnv() {
  for (const k of KEYS) saved[k] = process.env[k];
}

function restoreEnv() {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

function setValidSmtp() {
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_USER = 'orders@example.com';
  process.env.SMTP_PASSWORD = 'app-password';
  process.env.TRANSACTIONAL_FROM_EMAIL = 'StreetPlayR <orders@example.com>';
}

vi.mock('@/lib/orchestration/events', () => ({
  recordEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/monitoring/report', () => ({
  reportError: vi.fn().mockResolvedValue(undefined),
}));

const maybeSingle = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle,
              }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

afterEach(() => {
  restoreEnv();
  __setMailerForTests(null);
  maybeSingle.mockReset();
});

describe('SMTP config', () => {
  it('fails honestly when credentials are missing', () => {
    snapshotEnv();
    for (const k of KEYS) delete process.env[k];
    const r = getSmtpConfig();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.missing).toContain('SMTP_HOST');
      expect(r.error).toMatch(/not configured/);
    }
  });

  it('rejects invalid SMTP_PORT', () => {
    snapshotEnv();
    setValidSmtp();
    process.env.SMTP_PORT = 'gmail';
    const r = getSmtpConfig();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/SMTP_PORT is INVALID/);
  });

  it('accepts Gmail 465 SSL', () => {
    snapshotEnv();
    setValidSmtp();
    const r = getSmtpConfig();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config.host).toBe('smtp.gmail.com');
      expect(r.config.port).toBe(465);
      expect(r.config.secure).toBe(true);
    }
  });
});

describe('sendTransactionalEmail', () => {
  it('does not claim sent when SMTP is missing', async () => {
    snapshotEnv();
    for (const k of KEYS) delete process.env[k];
    const r = await sendTransactionalEmail({
      to: 'a@b.c',
      template: 'order_confirmation',
      html: '<p>x</p>',
      text: 'x',
      orderId: 'order-1',
    });
    expect(r.sent).toBe(false);
    expect(r.error).toMatch(/not configured/);
  });

  it('returns sent true only when SMTP accepts a recipient', async () => {
    snapshotEnv();
    setValidSmtp();
    maybeSingle.mockResolvedValue({ data: null });
    const sendMail = vi.fn().mockResolvedValue({ accepted: ['a@b.c'] });
    __setMailerForTests({ sendMail });
    const r = await sendTransactionalEmail({
      to: 'a@b.c',
      template: 'payment_failure',
      html: '<p>x</p>',
      text: 'x',
      orderId: 'order-1',
    });
    expect(r.sent).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('does not claim sent on provider failure', async () => {
    snapshotEnv();
    setValidSmtp();
    maybeSingle.mockResolvedValue({ data: null });
    __setMailerForTests({
      sendMail: vi.fn().mockRejectedValue(new Error('535 Authentication failed')),
    });
    const r = await sendTransactionalEmail({
      to: 'a@b.c',
      template: 'order_confirmation',
      html: '<p>x</p>',
      text: 'x',
      orderId: 'order-1',
    });
    expect(r.sent).toBe(false);
    expect(r.error).toMatch(/535/);
  });

  it('skips duplicate transactional send for same order+template', async () => {
    snapshotEnv();
    setValidSmtp();
    maybeSingle.mockResolvedValue({ data: { id: 'evt-1' } });
    const sendMail = vi.fn();
    __setMailerForTests({ sendMail });
    const r = await sendTransactionalEmail({
      to: 'a@b.c',
      template: 'order_confirmation',
      html: '<p>x</p>',
      text: 'x',
      orderId: 'order-1',
    });
    expect(r.sent).toBe(true);
    expect(r.skippedDuplicate).toBe(true);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '127.0.0.1' }),
}));

const rateLimit = vi.fn(async () => ({ ok: true, remaining: 7, retryAfterMs: 0 }));
vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => rateLimit(...args),
  clientKey: () => '127.0.0.1',
}));

const notifyMeSheetsConfigured = vi.fn(() => true);
const appendNotifyMeRow = vi.fn(async () => ({ ok: true }));
vi.mock('@/lib/notify-me/append-sheet', () => ({
  notifyMeSheetsConfigured: () => notifyMeSheetsConfigured(),
  appendNotifyMeRow: (...args: unknown[]) => appendNotifyMeRow(...args),
}));

import { submitNotifyMeAction } from './notify-me';

const valid = {
  name: 'Aayush Singh',
  email: 'aayush@example.com',
  phone: '9876543210',
  productId: 'prod-carp-grey',
  productName: 'playR Street Carpenter Pant Fleece (Grey)',
  productHandle: 'PS-PNT-CARP-GRY',
  variants: 'XS, S, M',
};

describe('submitNotifyMeAction', () => {
  beforeEach(() => {
    rateLimit.mockClear();
    rateLimit.mockResolvedValue({ ok: true, remaining: 7, retryAfterMs: 0 });
    notifyMeSheetsConfigured.mockReturnValue(true);
    appendNotifyMeRow.mockClear();
    appendNotifyMeRow.mockResolvedValue({ ok: true });
  });

  it('rejects invalid input and does not write', async () => {
    const result = await submitNotifyMeAction({ ...valid, email: 'nope', phone: '12', name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fields?.email).toBeTruthy();
      expect(result.fields?.phone).toBeTruthy();
      expect(result.fields?.name).toBeTruthy();
    }
    expect(appendNotifyMeRow).not.toHaveBeenCalled();
  });

  it('writes product context on a valid public submit', async () => {
    const result = await submitNotifyMeAction(valid);
    expect(result.success).toBe(true);
    expect(appendNotifyMeRow).toHaveBeenCalledTimes(1);
    const row = appendNotifyMeRow.mock.calls[0][0] as { productName: string; productHandle: string };
    expect(row.productName).toBe(valid.productName);
    expect(row.productHandle).toBe(valid.productHandle);
  });

  it('honeypot succeeds without storing', async () => {
    const result = await submitNotifyMeAction({ ...valid, website: 'https://spam.test' });
    expect(result.success).toBe(true);
    expect(appendNotifyMeRow).not.toHaveBeenCalled();
  });

  it('hides sheet failures from the client', async () => {
    appendNotifyMeRow.mockResolvedValue({ ok: false });
    const result = await submitNotifyMeAction(valid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).not.toMatch(/stack|spreadsheet|google|private/i);
    }
  });
});

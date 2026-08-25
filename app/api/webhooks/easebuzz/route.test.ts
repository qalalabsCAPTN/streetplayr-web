import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

const SALT = 'test_salt_123';
const KEY = 'test_key_abc';
const ORDER_ID = '11111111-1111-1111-1111-111111111111';
const TXNID = 'ORD-1-ABC123';

process.env.EASEBUZZ_SALT = SALT;
process.env.EASEBUZZ_MERCHANT_KEY = KEY;
process.env.NEXT_PUBLIC_SITE_URL = 'https://streetplayr.test';

// ── Mocks ────────────────────────────────────────────────────────────────
// route.ts touches the `orders` table directly (to resolve txnid → order)
// and delegates everything else to PaymentService/OrderService — mock at
// that boundary so these tests exercise the real webhook-adapter logic
// (hash check, status mapping, amount check, udf1 check) without a DB.

const mockMaybeSingle = vi.fn();
const mockOrdersQuery = {
  select: vi.fn(function (this: any) { return this; }),
  eq: vi.fn(function (this: any) { return this; }),
  maybeSingle: mockMaybeSingle,
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: vi.fn(() => mockOrdersQuery),
  }),
}));

const recordEventMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/orchestration/events', () => ({
  recordEvent: (...args: any[]) => recordEventMock(...args),
}));

const processWebhookEventMock = vi.fn().mockResolvedValue({ success: true, data: {} });
vi.mock('@/lib/orchestration/payment', () => ({
  PaymentService: { processWebhookEvent: (...args: any[]) => processWebhookEventMock(...args) },
}));

const { POST, verifyEasebuzzResponseHash, mapEasebuzzStatus } = await import('./route');

// ── Helpers ──────────────────────────────────────────────────────────────

function reverseHash(fields: {
  status: string; udf1: string; email: string; firstname: string;
  productinfo: string; amount: string; txnid: string; key: string;
}): string {
  const { status, udf1, email, firstname, productinfo, amount, txnid, key } = fields;
  const str = `${SALT}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  return crypto.createHash('sha512').update(str).digest('hex');
}

function makeForm(overrides: Record<string, string> = {}) {
  const base = {
    key: KEY,
    txnid: TXNID,
    amount: '499.00',
    productinfo: 'Streetplayr Order',
    firstname: 'Jane',
    email: 'jane@example.com',
    udf1: ORDER_ID,
    status: 'success',
  };
  const fields = { ...base, ...overrides };
  const hash = 'hash' in overrides ? overrides.hash! : reverseHash(fields as any);
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...fields, hash })) fd.set(k, v);
  return fd;
}

function makeRequest(fd: FormData) {
  return new Request('https://streetplayr.test/api/webhooks/easebuzz', {
    method: 'POST',
    body: fd,
  });
}

function setOrder(order: { id: string; grand_total: number; status: string } | null) {
  mockMaybeSingle.mockResolvedValueOnce({ data: order, error: null });
}

beforeEach(() => {
  processWebhookEventMock.mockClear().mockResolvedValue({ success: true, data: {} });
  recordEventMock.mockClear();
  mockMaybeSingle.mockReset();
});

// ── Pure function tests ─────────────────────────────────────────────────

describe('mapEasebuzzStatus', () => {
  it('maps success → payment_intent.succeeded', () => {
    expect(mapEasebuzzStatus('success')).toBe('payment_intent.succeeded');
  });
  it('maps failure/failed → payment_intent.payment_failed', () => {
    expect(mapEasebuzzStatus('failure')).toBe('payment_intent.payment_failed');
    expect(mapEasebuzzStatus('failed')).toBe('payment_intent.payment_failed');
  });
  it('maps pending → payment_intent.processing (not a failure)', () => {
    expect(mapEasebuzzStatus('pending')).toBe('payment_intent.processing');
  });
  it('maps userCancelled/userDropped → payment_intent.canceled', () => {
    expect(mapEasebuzzStatus('userCancelled')).toBe('payment_intent.canceled');
    expect(mapEasebuzzStatus('userDropped')).toBe('payment_intent.canceled');
  });
  it('defaults unknown status to payment_failed rather than silently succeeding', () => {
    expect(mapEasebuzzStatus('something_new')).toBe('payment_intent.payment_failed');
  });
});

describe('verifyEasebuzzResponseHash', () => {
  const base = {
    key: KEY, txnid: TXNID, amount: '499.00', productinfo: 'x',
    firstname: 'Jane', email: 'jane@example.com', udf1: ORDER_ID, status: 'success',
  };

  it('accepts a correctly computed hash', () => {
    const hash = reverseHash(base);
    expect(verifyEasebuzzResponseHash({ ...base, hash }, SALT)).toBe(true);
  });

  it('rejects a tampered amount (Attack A)', () => {
    const hash = reverseHash(base); // hash computed for amount 499.00
    expect(verifyEasebuzzResponseHash({ ...base, amount: '4.00', hash }, SALT)).toBe(false);
  });

  it('rejects a tampered udf1/order id (Attack B)', () => {
    const hash = reverseHash(base);
    expect(verifyEasebuzzResponseHash({ ...base, udf1: 'some-other-order', hash }, SALT)).toBe(false);
  });

  it('rejects a forged hash with no knowledge of the salt (Attack C)', () => {
    const forged = crypto.createHash('sha512').update('garbage').digest('hex');
    expect(verifyEasebuzzResponseHash({ ...base, hash: forged }, SALT)).toBe(false);
  });

  it('rejects a missing hash', () => {
    expect(verifyEasebuzzResponseHash({ ...base, hash: '' }, SALT)).toBe(false);
  });
});

// ── Route-level tests (security + state routing) ───────────────────────

describe('POST /api/webhooks/easebuzz', () => {
  it('processes a valid success webhook and redirects to the success page', async () => {
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'pending' });
    const res = await POST(makeRequest(makeForm()));

    expect(processWebhookEventMock).toHaveBeenCalledTimes(1);
    const call = processWebhookEventMock.mock.calls[0][0];
    expect(call.eventType).toBe('payment_intent.succeeded');
    expect(call.provider).toBe('easebuzz'); // provider-neutral call shape, not stripe-prefixed
    expect(call.providerEventId).toBe(`easebuzz:${TXNID}:payment_intent.succeeded`);
    expect(call.providerTransactionId).toBe(TXNID);
    expect(call.amount).toBe(49900); // normalized to paise: 499.00 * 100
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('/checkout/success');
  });

  it('rejects a forged webhook — invalid hash never reaches PaymentService (Attack C)', async () => {
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'pending' });
    const res = await POST(makeRequest(makeForm({ hash: 'deadbeef'.repeat(16) })));

    expect(res.status).toBe(400);
    expect(processWebhookEventMock).not.toHaveBeenCalled();
  });

  it('rejects when udf1 does not match the order resolved from txnid (Attack B/E)', async () => {
    // txnid legitimately resolves to ORDER_ID, but the (still correctly-hashed)
    // payload claims a different order via udf1.
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'pending' });
    const otherOrderId = '22222222-2222-2222-2222-222222222222';
    const res = await POST(makeRequest(makeForm({ udf1: otherOrderId })));

    expect(res.status).toBe(400);
    expect(processWebhookEventMock).not.toHaveBeenCalled();
  });

  it('acknowledges but does not process a success for an unknown/unrecognized transaction', async () => {
    setOrder(null);
    const res = await POST(makeRequest(makeForm()));

    expect(res.status).toBe(200);
    expect(processWebhookEventMock).not.toHaveBeenCalled();
  });

  it('rejects a success claim whose (validly-hashed) amount does not match the order (Attack F)', async () => {
    // Order in the DB actually costs 4999; the callback — correctly hashed
    // for its own contents — claims only 1.00 was paid (e.g. a stale session
    // replayed against an order whose total changed, or a compromised amount
    // field an attacker who does NOT know the salt cannot forge on its own —
    // this proves the DB-side cross-check catches it even so).
    setOrder({ id: ORDER_ID, grand_total: 4999, status: 'pending' });
    const res = await POST(makeRequest(makeForm({ amount: '1.00' })));

    expect(processWebhookEventMock).not.toHaveBeenCalled();
    // No order-status transition on mismatch — the live orders_status_check
    // constraint has no "held for review" state, so the order is
    // deliberately left as-is; the critical recordEvent is the only signal.
    expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'easebuzz.amount_mismatch', severity: 'critical' })
    );
    expect(res.headers.get('location')).toContain('error=payment_failed');
  });

  it('maps a failed payment to the failure redirect', async () => {
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'pending' });
    const res = await POST(makeRequest(makeForm({ status: 'failure' })));

    expect(processWebhookEventMock).toHaveBeenCalledTimes(1);
    expect(processWebhookEventMock.mock.calls[0][0].eventType).toBe('payment_intent.payment_failed');
    expect(res.headers.get('location')).toContain('error=payment_failed');
  });

  it('maps a pending payment to the pending redirect, NOT the failure redirect', async () => {
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'pending' });
    const res = await POST(makeRequest(makeForm({ status: 'pending' })));

    expect(processWebhookEventMock).toHaveBeenCalledTimes(1);
    expect(processWebhookEventMock.mock.calls[0][0].eventType).toBe('payment_intent.processing');
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('pending=1');
    expect(location).not.toContain('error=payment_failed');
  });

  it('builds the same idempotency key for two identical replayed webhooks (Attack D precondition)', async () => {
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'pending' });
    setOrder({ id: ORDER_ID, grand_total: 499, status: 'confirmed' }); // order now confirmed after 1st webhook
    const form1 = makeForm();
    const form2 = makeForm(); // identical payload, same hash

    await POST(makeRequest(form1));
    await POST(makeRequest(form2));

    expect(processWebhookEventMock).toHaveBeenCalledTimes(2);
    const key1 = processWebhookEventMock.mock.calls[0][0].providerEventId;
    const key2 = processWebhookEventMock.mock.calls[1][0].providerEventId;
    // Same key on both calls is what lets PaymentService's idempotencyGuard
    // (and the payment_events unique index) collapse the second call into a
    // no-op — this route does not itself dedupe, it must hand PaymentService
    // a stable key every time.
    expect(key1).toBe(key2);
    expect(key1).toBe(`easebuzz:${TXNID}:payment_intent.succeeded`);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  generateInitiateHash,
  getEasebuzzPayHost,
  getEasebuzzDashboardHost,
  mapEasebuzzStatus,
  verifyResponseHash,
  getEasebuzzCredentials,
  validateInitiateParams,
  assertEasebuzzLiveAllowed,
} from './client';

const CREDS = { merchantKey: 'test_key', salt: 'test_salt', env: 'test' as const };

describe('getEasebuzzPayHost / getEasebuzzDashboardHost', () => {
  it('uses sandbox pay host for initiate', () => {
    expect(getEasebuzzPayHost('test')).toBe('https://testpay.easebuzz.in');
  });

  it('uses sandbox dashboard host for transaction/refund APIs', () => {
    expect(getEasebuzzDashboardHost('test')).toBe('https://testdashboard.easebuzz.in');
  });

  it('uses production hosts only when env is prod', () => {
    expect(getEasebuzzPayHost('prod')).toBe('https://pay.easebuzz.in');
    expect(getEasebuzzDashboardHost('prod')).toBe('https://dashboard.easebuzz.in');
  });
});

describe('generateInitiateHash', () => {
  it('matches official Easebuzz initiate hash sequence', () => {
    const hash = generateInitiateHash(CREDS, {
      txnid: 'TXN1',
      amount: '100.00',
      productinfo: 'Order',
      firstname: 'Jane',
      email: 'jane@example.com',
      udf1: 'order-uuid',
    });
    const expected = crypto
      .createHash('sha512')
      .update('test_key|TXN1|100.00|Order|Jane|jane@example.com|order-uuid||||||||||test_salt')
      .digest('hex');
    expect(hash).toBe(expected);
  });
});

describe('verifyResponseHash', () => {
  const base = {
    key: 'test_key',
    txnid: 'TXN1',
    amount: '100.00',
    productinfo: 'Order',
    firstname: 'Jane',
    email: 'jane@example.com',
    udf1: 'order-uuid',
    status: 'success',
  };

  function reverseHash(fields: typeof base): string {
    const { status, udf1, email, firstname, productinfo, amount, txnid, key } = fields;
    const str = `test_salt|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    return crypto.createHash('sha512').update(str).digest('hex');
  }

  it('accepts valid reverse hash', () => {
    const hash = reverseHash(base);
    expect(verifyResponseHash({ ...base, hash }, 'test_salt')).toBe(true);
  });

  it('rejects tampered amount', () => {
    const hash = reverseHash(base);
    expect(verifyResponseHash({ ...base, amount: '1.00', hash }, 'test_salt')).toBe(false);
  });
});

describe('validateInitiateParams', () => {
  const valid = {
    txnid: 'TXN1',
    amount: '10.00',
    productinfo: 'Order',
    firstname: 'Jane',
    email: 'jane@example.com',
    phone: '9999999999',
    surl: 'https://example.com/s',
    furl: 'https://example.com/f',
  };

  it('accepts valid params', () => {
    expect(validateInitiateParams(valid)).toBeNull();
  });

  it('rejects amount without decimal', () => {
    expect(validateInitiateParams({ ...valid, amount: '10' })).toMatch(/decimal/i);
  });

  it('rejects amount < 1', () => {
    expect(validateInitiateParams({ ...valid, amount: '0.50' })).toMatch(/greater than or equal to 1/i);
  });

  it('rejects txnid longer than 40', () => {
    expect(validateInitiateParams({ ...valid, txnid: 'X'.repeat(41) })).toMatch(/txnid/i);
  });
});

describe('mapEasebuzzStatus', () => {
  it('maps success to payment_intent.succeeded', () => {
    expect(mapEasebuzzStatus('success')).toBe('payment_intent.succeeded');
  });
});

describe('getEasebuzzCredentials', () => {
  beforeEach(() => {
    delete process.env.EASEBUZZ_MERCHANT_KEY;
    delete process.env.EASEBUZZ_SALT;
    delete process.env.EASEBUZZ_ENV;
    delete process.env.EASEBUZZ_ALLOW_LIVE;
    delete process.env.VERCEL_ENV;
  });

  it('returns null when credentials missing', () => {
    expect(getEasebuzzCredentials()).toBeNull();
  });

  it('returns null when EASEBUZZ_ENV unset (no silent sandbox or live fallback)', () => {
    process.env.EASEBUZZ_MERCHANT_KEY = 'key';
    process.env.EASEBUZZ_SALT = 'salt';
    expect(getEasebuzzCredentials()).toBeNull();
  });

  it('rejects production/live aliases — never maps them to prod', () => {
    process.env.EASEBUZZ_MERCHANT_KEY = 'key';
    process.env.EASEBUZZ_SALT = 'salt';
    process.env.EASEBUZZ_ENV = 'production';
    expect(getEasebuzzCredentials()).toBeNull();
    process.env.EASEBUZZ_ENV = 'live';
    expect(getEasebuzzCredentials()).toBeNull();
  });

  it('uses test host only when env is exactly test', () => {
    process.env.EASEBUZZ_MERCHANT_KEY = 'key';
    process.env.EASEBUZZ_SALT = 'salt';
    process.env.EASEBUZZ_ENV = 'test';
    expect(getEasebuzzCredentials()?.env).toBe('test');
  });
});

describe('assertEasebuzzLiveAllowed', () => {
  beforeEach(() => {
    delete process.env.EASEBUZZ_ALLOW_LIVE;
    delete process.env.VERCEL_ENV;
  });

  it('allows sandbox always', () => {
    expect(assertEasebuzzLiveAllowed(CREDS)).toBeNull();
  });

  it('blocks live charging outside Vercel production', () => {
    const msg = assertEasebuzzLiveAllowed({ ...CREDS, env: 'prod' });
    expect(msg).toMatch(/Refusing live Easebuzz/);
  });

  it('allows live on Vercel production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(assertEasebuzzLiveAllowed({ ...CREDS, env: 'prod' })).toBeNull();
  });
});

describe('initiatePayment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls sandbox initiateLink endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 1, data: 'access-key-abc' }), { status: 200 })
    );

    const { initiatePayment } = await import('./client');
    const result = await initiatePayment(CREDS, {
      txnid: 'TXN1',
      amount: '100.00',
      productinfo: 'Order',
      firstname: 'Jane',
      email: 'jane@example.com',
      phone: '9999999999',
      surl: 'https://example.com/s',
      furl: 'https://example.com/f',
      udf1: 'order-1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paymentUrl).toBe('https://testpay.easebuzz.in/pay/access-key-abc');
    }
    expect(fetchMock.mock.calls[0][0]).toBe('https://testpay.easebuzz.in/payment/initiateLink');
  });
});

describe('getTransactionStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls sandbox DASHBOARD transaction retrieve endpoint (not pay host)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 1,
          data: { txnid: 'TXN1', status: 'success', amount: '100.00' },
        }),
        { status: 200 }
      )
    );

    const { getTransactionStatus } = await import('./client');
    const result = await getTransactionStatus(CREDS, 'TXN1');

    expect(result.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://testdashboard.easebuzz.in/transaction/v2/retrieve',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('initiateRefund / getRefundStatus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts refund to dashboard host with official param names', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 1, data: { refund: 'ok' } }), { status: 200 })
    );

    const { initiateRefund } = await import('./client');
    await initiateRefund(CREDS, {
      easebuzzId: 'EBZ123',
      refundAmount: '10.00',
      merchantRefundId: 'REF1',
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testdashboard.easebuzz.in/transaction/v2/refund'
    );
    const body = String(fetchMock.mock.calls[0][1]?.body);
    expect(body).toContain('easebuzz_id=');
    expect(body).toContain('merchant_refund_id=');
    expect(body).toContain('refund_amount=');
  });

  it('posts refund status to dashboard refund/v1/retrieve', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 1, data: {} }), { status: 200 })
    );

    const { getRefundStatus } = await import('./client');
    await getRefundStatus(CREDS, 'EBZ123');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testdashboard.easebuzz.in/refund/v1/retrieve'
    );
  });
});

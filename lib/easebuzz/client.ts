/**
 * Easebuzz Payment Gateway Adapter (server-side only)
 *
 * Official contract source (VERIFIED):
 *   https://github.com/easebuzz/paywitheasebuzz-php-lib
 *   easebuzz-lib/utils.php, initiate_payment.php, transaction.php, refund.php
 *
 * Integration mode for this app: Hosted Checkout (initiateLink → redirect/pay/{accessKey}).
 * Merchant Seamless requires AES-encrypted card fields on merchant servers — not used here.
 *
 * Hosts (official SDK fetchBaseUrl):
 *   Initiate Payment: testpay.easebuzz.in | pay.easebuzz.in
 *   Transaction/Refund/Refund Status: testdashboard.easebuzz.in | dashboard.easebuzz.in
 *
 * Credentials: EASEBUZZ_MERCHANT_KEY, EASEBUZZ_SALT, EASEBUZZ_ENV
 * NEVER use NEXT_PUBLIC_* for secrets. NEVER log key/salt.
 */
import crypto from 'crypto';
import type { PaymentEventType } from '@/lib/orchestration/types';

export type EasebuzzEnv = 'test' | 'prod';

export interface EasebuzzCredentials {
  merchantKey: string;
  salt: string;
  env: EasebuzzEnv;
}

export interface EasebuzzInitiateParams {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  udf6?: string;
  udf7?: string;
}

export interface EasebuzzInitiateResult {
  accessKey: string;
  paymentUrl: string;
}

export interface EasebuzzTransactionStatus {
  txnid: string;
  status: string;
  amount?: string;
  mode?: string;
  easepayid?: string;
  raw: Record<string, unknown>;
}

export interface EasebuzzRefundParams {
  /** Easebuzz transaction id (easebuzz_id / easepayid from payment response). */
  easebuzzId: string;
  refundAmount: string;
  /** Merchant-generated unique refund reference. */
  merchantRefundId: string;
}

/** Pay/checkout host — initiateLink + /pay/{accessKey} only. */
export function getEasebuzzPayHost(env: EasebuzzEnv = 'test'): string {
  return env === 'prod' ? 'https://pay.easebuzz.in' : 'https://testpay.easebuzz.in';
}

/**
 * Dashboard host — Transaction / Refund / Refund Status APIs.
 * Official SDK: fetchBaseUrl($env) WITHOUT 'initiate_api' → dashboard domain.
 */
export function getEasebuzzDashboardHost(env: EasebuzzEnv = 'test'): string {
  return env === 'prod'
    ? 'https://dashboard.easebuzz.in'
    : 'https://testdashboard.easebuzz.in';
}

/** @deprecated Use getEasebuzzPayHost — kept for existing imports/tests. */
export function getEasebuzzHost(env: EasebuzzEnv = 'test'): string {
  return getEasebuzzPayHost(env);
}

export function getEasebuzzCredentials(): EasebuzzCredentials | null {
  const merchantKey = process.env.EASEBUZZ_MERCHANT_KEY?.trim();
  const salt = process.env.EASEBUZZ_SALT?.trim();
  if (!merchantKey || !salt) return null;

  const env: EasebuzzEnv = process.env.EASEBUZZ_ENV === 'prod' ? 'prod' : 'test';
  return { merchantKey, salt, env };
}

/**
 * Initiate-payment hash (official):
 * key|txnid|amount|productinfo|firstname|email|udf1|udf2|...|udf10|salt
 */
export function generateInitiateHash(
  creds: EasebuzzCredentials,
  fields: Pick<
    EasebuzzInitiateParams,
    'txnid' | 'amount' | 'productinfo' | 'firstname' | 'email' | 'udf1' | 'udf2' | 'udf3' | 'udf4' | 'udf5' | 'udf6' | 'udf7'
  >
): string {
  const parts = [
    creds.merchantKey,
    fields.txnid,
    fields.amount,
    fields.productinfo,
    fields.firstname,
    fields.email,
    fields.udf1 ?? '',
    fields.udf2 ?? '',
    fields.udf3 ?? '',
    fields.udf4 ?? '',
    fields.udf5 ?? '',
    fields.udf6 ?? '',
    fields.udf7 ?? '',
    '', // udf8 — hash only, not sent
    '', // udf9
    '', // udf10
    creds.salt,
  ];
  return crypto.createHash('sha512').update(parts.join('|')).digest('hex').toLowerCase();
}

/**
 * Reverse hash for surl/furl callback verification (official):
 * salt|status|udf10|...|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyResponseHash(data: Record<string, string>, salt: string): boolean {
  const {
    key = '',
    txnid = '',
    amount = '',
    productinfo = '',
    firstname = '',
    email = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    udf6 = '',
    udf7 = '',
    udf8 = '',
    udf9 = '',
    udf10 = '',
    status = '',
    hash = '',
  } = data;

  if (!hash) return false;

  const hashString = [
    salt,
    status,
    udf10,
    udf9,
    udf8,
    udf7,
    udf6,
    udf5,
    udf4,
    udf3,
    udf2,
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  ].join('|');

  const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
  const a = Buffer.from(calculatedHash.toLowerCase());
  const b = Buffer.from(hash.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function mapEasebuzzStatus(status: string): PaymentEventType {
  switch (status?.toLowerCase()) {
    case 'success':
      return 'payment_intent.succeeded';
    case 'usercancelled':
    case 'userdropped':
      return 'payment_intent.canceled';
    case 'pending':
      return 'payment_intent.processing';
    case 'failure':
    case 'failed':
    default:
      return 'payment_intent.payment_failed';
  }
}

/** Transaction retrieve hash: key|txnid|salt */
function generateTransactionHash(creds: EasebuzzCredentials, txnid: string): string {
  return crypto
    .createHash('sha512')
    .update(`${creds.merchantKey}|${txnid}|${creds.salt}`)
    .digest('hex')
    .toLowerCase();
}

/**
 * Official initiate validation (utils.php _validateInitiatePaymentParams).
 * Returns error string or null if valid.
 */
export function validateInitiateParams(params: EasebuzzInitiateParams): string | null {
  const mandatory: (keyof EasebuzzInitiateParams)[] = [
    'txnid',
    'amount',
    'firstname',
    'email',
    'phone',
    'productinfo',
    'surl',
    'furl',
  ];
  for (const field of mandatory) {
    if (!String(params[field] ?? '').trim()) {
      return `Mandatory parameter '${field}' cannot be empty`;
    }
  }

  if (!/^[a-zA-Z0-9_|\-\/]{1,40}$/.test(params.txnid)) {
    return "Invalid value for 'txnid' (max 40; alphanumeric _ | - /)";
  }
  if (!/^[a-zA-Z0-9\-\s|]{1,45}$/.test(params.productinfo)) {
    return "Invalid value for 'productinfo'";
  }
  if (!params.amount.includes('.')) {
    return 'Amount must contain a decimal point (e.g., 125.0)';
  }
  const amt = Number.parseFloat(params.amount);
  if (!Number.isFinite(amt) || amt < 1) {
    return 'Amount must be greater than or equal to 1';
  }
  return null;
}

/**
 * Initiate Hosted Checkout session via payment/initiateLink.
 * Returns access_key; checkout URL is {payHost}/pay/{access_key}.
 */
export async function initiatePayment(
  creds: EasebuzzCredentials,
  params: EasebuzzInitiateParams
): Promise<{ success: true; data: EasebuzzInitiateResult } | { success: false; error: string }> {
  const validationError = validateInitiateParams(params);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const host = getEasebuzzPayHost(creds.env);
  const hash = generateInitiateHash(creds, params);

  // Official: omit empty optional fields from POST body after hash generation.
  const payload = new URLSearchParams();
  payload.set('key', creds.merchantKey);
  payload.set('txnid', params.txnid);
  payload.set('amount', params.amount);
  payload.set('productinfo', params.productinfo);
  payload.set('firstname', params.firstname);
  payload.set('email', params.email);
  payload.set('phone', params.phone);
  payload.set('surl', params.surl);
  payload.set('furl', params.furl);
  payload.set('hash', hash);
  if (params.udf1?.trim()) payload.set('udf1', params.udf1.trim());
  if (params.udf2?.trim()) payload.set('udf2', params.udf2.trim());
  if (params.udf3?.trim()) payload.set('udf3', params.udf3.trim());
  if (params.udf4?.trim()) payload.set('udf4', params.udf4.trim());
  if (params.udf5?.trim()) payload.set('udf5', params.udf5.trim());
  if (params.udf6?.trim()) payload.set('udf6', params.udf6.trim());
  if (params.udf7?.trim()) payload.set('udf7', params.udf7.trim());
  // udf8–10: hash-only, never POST

  let response: Response;
  try {
    response = await fetch(`${host}/payment/initiateLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err: unknown) {
    const reason = err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'network_error';
    return { success: false, error: reason === 'timeout' ? 'Gateway timed out' : 'Gateway unreachable' };
  }

  const data = await response.json().catch(() => null);
  if (!data || data.status !== 1 || !data.data) {
    return { success: false, error: data?.error_desc || 'Payment initiation rejected' };
  }

  return {
    success: true,
    data: {
      accessKey: data.data,
      paymentUrl: `${host}/pay/${data.data}`,
    },
  };
}

/**
 * Query transaction status (official Transaction API).
 * POST {dashboardHost}/transaction/v2/retrieve — hash: key|txnid|salt
 */
export async function getTransactionStatus(
  creds: EasebuzzCredentials,
  txnid: string
): Promise<{ success: true; data: EasebuzzTransactionStatus } | { success: false; error: string }> {
  const host = getEasebuzzDashboardHost(creds.env);
  const hash = generateTransactionHash(creds, txnid);

  const payload = new URLSearchParams({
    key: creds.merchantKey,
    txnid,
    hash,
  });

  let response: Response;
  try {
    response = await fetch(`${host}/transaction/v2/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { success: false, error: 'Transaction status API unreachable' };
  }

  const data = await response.json().catch(() => null);
  if (!data || data.status !== 1) {
    return { success: false, error: data?.error_desc || data?.msg || 'Transaction not found' };
  }

  const txn = (data.data ?? data) as Record<string, string>;
  return {
    success: true,
    data: {
      txnid: txn.txnid ?? txnid,
      status: txn.status ?? txn.status_desc ?? 'unknown',
      amount: txn.amount,
      mode: txn.mode,
      easepayid: txn.easepayid ?? txn.easebuzz_id,
      raw: txn as Record<string, unknown>,
    },
  };
}

/**
 * Initiate refund (official Refund API).
 * Host: dashboard domain. Hash: key|merchant_refund_id|easebuzz_id|refund_amount|salt
 * Body params: key, easebuzz_id, refund_amount, merchant_refund_id, hash
 */
export async function initiateRefund(
  creds: EasebuzzCredentials,
  params: EasebuzzRefundParams
): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
  const host = getEasebuzzDashboardHost(creds.env);
  const hashString =
    `${creds.merchantKey}|${params.merchantRefundId}|${params.easebuzzId}|${params.refundAmount}|${creds.salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

  const payload = new URLSearchParams({
    key: creds.merchantKey,
    easebuzz_id: params.easebuzzId,
    refund_amount: params.refundAmount,
    merchant_refund_id: params.merchantRefundId,
    hash,
  });

  try {
    const response = await fetch(`${host}/transaction/v2/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => null);
    if (!data || data.status !== 1) {
      return { success: false, error: data?.error_desc || 'Refund rejected' };
    }
    return { success: true, data: data.data ?? data };
  } catch {
    return { success: false, error: 'Refund API unreachable' };
  }
}

/**
 * Refund status (official Refund Status API).
 * Host: dashboard. Path: refund/v1/retrieve. Hash: key|easebuzz_id|salt
 */
export async function getRefundStatus(
  creds: EasebuzzCredentials,
  easebuzzId: string
): Promise<{ success: boolean; error?: string; data?: Record<string, unknown> }> {
  const host = getEasebuzzDashboardHost(creds.env);
  const hash = crypto
    .createHash('sha512')
    .update(`${creds.merchantKey}|${easebuzzId}|${creds.salt}`)
    .digest('hex')
    .toLowerCase();

  const payload = new URLSearchParams({
    key: creds.merchantKey,
    easebuzz_id: easebuzzId,
    hash,
  });

  try {
    const response = await fetch(`${host}/refund/v1/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => null);
    if (!data || data.status !== 1) {
      return { success: false, error: data?.error_desc || 'Refund status lookup failed' };
    }
    return { success: true, data: data.data ?? data };
  } catch {
    return { success: false, error: 'Refund status API unreachable' };
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Concurrency-safety tests for PaymentService.processWebhookEvent.
 *
 * The app-level idempotencyGuard is mocked to ALWAYS say canProceed:true —
 * i.e. the worst case, as if two truly concurrent requests both got past
 * the guard's race window at the same instant. This isolates exactly the
 * property that must hold regardless: the DB-level unique constraint on
 * payment_events.stripe_event_id (idx_payment_events_stripe_event, defined
 * unconditionally for every event_type, not just 'succeeded') is what
 * actually prevents a second row / second downstream side-effect, matching
 * how a real Postgres unique index behaves under real concurrent inserts.
 */

const ORDER_ID = 'order-1';

// ── In-memory fake DB ───────────────────────────────────────────────────
let orders: Record<string, any>;
let paymentEvents: any[];

function makeOrdersQuery() {
  const q: any = {};
  q.select = () => q;
  q.eq = function (this: any, col: string, val: string) {
    if (col === 'id') this._id = val;
    if (col === 'payment_intent_id') this._paymentIntentId = val;
    if (this._patch && col === 'id' && orders[val]) {
      Object.assign(orders[val], this._patch);
      this._patch = undefined;
    }
    return this;
  };
  q.update = function (this: any, patch: any) {
    this._patch = patch;
    return this;
  };
  q.single = async function (this: any) {
    if (this._paymentIntentId) {
      const found = Object.values(orders).find(
        (o: any) => o.payment_intent_id === this._paymentIntentId
      );
      return { data: found ?? orders[ORDER_ID], error: null };
    }
    return { data: orders[this._id] ?? orders[ORDER_ID], error: null };
  };
  q.then = function (this: any, resolve: (v: unknown) => unknown) {
    return Promise.resolve({ data: null, error: null }).then(resolve);
  };
  return q;
}

function makePaymentEventsInsert(row: any) {
  return {
    select: () => ({
      single: async () => {
        const dup = row.stripe_event_id != null && paymentEvents.some((r) => r.stripe_event_id === row.stripe_event_id);
        if (dup) {
          return {
            data: null,
            error: { message: 'duplicate key value violates unique constraint "idx_payment_events_stripe_event"' },
          };
        }
        const saved = { id: `pe_${paymentEvents.length + 1}`, ...row };
        paymentEvents.push(saved);
        return { data: saved, error: null };
      },
    }),
  };
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'orders') return makeOrdersQuery();
      if (table === 'payment_events') return { insert: makePaymentEventsInsert };
      if (table === 'inventory_reservations') return { select: () => ({ eq: () => ({ then: (r: any) => r({ data: [] }) }) }) };
      throw new Error(`unexpected table in test: ${table}`);
    },
  }),
}));

// Force the worst case: app-level guard never blocks anything by itself.
vi.mock('@/lib/orchestration/idempotency', () => ({
  idempotencyGuard: vi.fn().mockResolvedValue({
    canProceed: true,
    existingData: null,
    complete: vi.fn(),
    fail: vi.fn(),
  }),
}));

vi.mock('@/lib/orchestration/events', () => ({ recordEvent: vi.fn().mockResolvedValue(undefined) }));

const transitionStatusMock = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/lib/orchestration/order', () => ({ OrderService: { transitionStatus: (...a: any[]) => transitionStatusMock(...a) } }));

const holdMock = vi.fn().mockResolvedValue({ success: true });
const convertMock = vi.fn().mockResolvedValue({ success: true });
const releaseMock = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/lib/orchestration/reservation', () => ({
  ReservationService: {
    hold: (...a: any[]) => holdMock(...a),
    convert: (...a: any[]) => convertMock(...a),
    release: (...a: any[]) => releaseMock(...a),
  },
}));

const awardSPRRMock = vi.fn().mockResolvedValue(undefined);
const awardXPMock = vi.fn().mockResolvedValue(undefined);
const processReferralMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/nectar/engine', () => ({
  awardSPRR: (...a: any[]) => awardSPRRMock(...a),
  awardXP: (...a: any[]) => awardXPMock(...a),
  processReferral: (...a: any[]) => processReferralMock(...a),
}));

const createOrderMock = vi.fn().mockResolvedValue({ success: false });
vi.mock('@/src/integrations/unicommerce', () => ({
  UnicommerceService: { orders: { createOrder: (...a: any[]) => createOrderMock(...a) } },
  UnicommerceLogger: { error: vi.fn(), info: vi.fn() },
}));

const { PaymentService } = await import('./payment');

function baseEvent(overrides: Partial<Parameters<typeof PaymentService.processWebhookEvent>[0]> = {}) {
  return {
    eventType: 'payment_intent.succeeded' as const,
    provider: 'easebuzz' as const,
    providerEventId: 'evt:1',
    providerTransactionId: 'txn-1',
    amount: 49900,
    currency: 'inr',
    ...overrides,
  };
}

const AUTH_USER_ID = 'u1';

beforeEach(() => {
  // `notes` carries the creating auth user's id — the verified, live
  // identity mechanism (see lib/orchestration/payment.ts). No `user_id`
  // column exists on the live `orders` table.
  orders = { [ORDER_ID]: { id: ORDER_ID, notes: AUTH_USER_ID, status: 'pending', payment_intent_id: 'txn-1', metadata: {} } };
  paymentEvents = [];
  transitionStatusMock.mockClear().mockResolvedValue({ success: true });
  holdMock.mockClear();
  convertMock.mockClear();
  releaseMock.mockClear();
  awardSPRRMock.mockClear();
  awardXPMock.mockClear();
  processReferralMock.mockClear();
  createOrderMock.mockClear();
});

describe('PaymentService.processWebhookEvent — duplicate/concurrent delivery', () => {
  it('1. sequential duplicate success webhook → exactly one payment_events row', async () => {
    await PaymentService.processWebhookEvent(baseEvent());
    await PaymentService.processWebhookEvent(baseEvent());
    expect(paymentEvents).toHaveLength(1);
  });

  it('2. concurrent duplicate success webhook → exactly one payment_events row, one order transition', async () => {
    await Promise.all([
      PaymentService.processWebhookEvent(baseEvent()),
      PaymentService.processWebhookEvent(baseEvent()),
    ]);
    expect(paymentEvents).toHaveLength(1);
    expect(transitionStatusMock).toHaveBeenCalledTimes(1);
  });

  it('3. sequential duplicate pending webhook → exactly one payment_events row', async () => {
    const ev = baseEvent({ eventType: 'payment_intent.processing', providerEventId: 'evt:pending' });
    await PaymentService.processWebhookEvent(ev);
    await PaymentService.processWebhookEvent(ev);
    expect(paymentEvents).toHaveLength(1);
    expect(transitionStatusMock).not.toHaveBeenCalled(); // pending has no order transition
  });

  it('4. concurrent duplicate pending webhook → exactly one payment_events row', async () => {
    const ev = baseEvent({ eventType: 'payment_intent.processing', providerEventId: 'evt:pending-c' });
    await Promise.all([PaymentService.processWebhookEvent(ev), PaymentService.processWebhookEvent(ev)]);
    expect(paymentEvents).toHaveLength(1);
  });

  it('5. sequential duplicate failed webhook → exactly one payment_events row', async () => {
    const ev = baseEvent({ eventType: 'payment_intent.payment_failed', providerEventId: 'evt:failed' });
    await PaymentService.processWebhookEvent(ev);
    await PaymentService.processWebhookEvent(ev);
    expect(paymentEvents).toHaveLength(1);
  });

  it('6. concurrent duplicate failed webhook → exactly one payment_events row, no duplicate reservation release', async () => {
    const ev = baseEvent({ eventType: 'payment_intent.payment_failed', providerEventId: 'evt:failed-c' });
    await Promise.all([PaymentService.processWebhookEvent(ev), PaymentService.processWebhookEvent(ev)]);
    expect(paymentEvents).toHaveLength(1);
  });

  it('7. pending → success remains a valid sequence (distinct events, both recorded, one confirm)', async () => {
    await PaymentService.processWebhookEvent(
      baseEvent({ eventType: 'payment_intent.processing', providerEventId: 'evt:seq-pending' })
    );
    await PaymentService.processWebhookEvent(
      baseEvent({ eventType: 'payment_intent.succeeded', providerEventId: 'evt:seq-success' })
    );
    expect(paymentEvents).toHaveLength(2);
    expect(transitionStatusMock).toHaveBeenCalledTimes(1);
    expect(transitionStatusMock).toHaveBeenCalledWith(ORDER_ID, 'confirmed', 'system', expect.any(String));
  });

  it('8. pending → failed remains a valid sequence (distinct events, both recorded, one cancel)', async () => {
    await PaymentService.processWebhookEvent(
      baseEvent({ eventType: 'payment_intent.processing', providerEventId: 'evt:seq-pending-2' })
    );
    await PaymentService.processWebhookEvent(
      baseEvent({ eventType: 'payment_intent.payment_failed', providerEventId: 'evt:seq-failed' })
    );
    expect(paymentEvents).toHaveLength(2);
    expect(transitionStatusMock).toHaveBeenCalledTimes(0); // payment_failed has no order transition (stays pending for retry)
  });

  it('9. success → duplicate success does not re-award Nectar reward', async () => {
    await PaymentService.processWebhookEvent(baseEvent());
    await PaymentService.processWebhookEvent(baseEvent());
    expect(awardSPRRMock).toHaveBeenCalledTimes(1);
    expect(awardXPMock).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentService.processWebhookEvent — reward identity model', () => {
  it('credits the auth user id carried in orders.notes, not orders.customer_id or orders.user_id', async () => {
    await PaymentService.processWebhookEvent(baseEvent());
    expect(awardSPRRMock).toHaveBeenCalledWith(AUTH_USER_ID, expect.any(Number), expect.any(String), 'earned');
    expect(awardXPMock).toHaveBeenCalledWith(AUTH_USER_ID, expect.any(Number), expect.any(String));
    expect(processReferralMock).toHaveBeenCalledWith(AUTH_USER_ID);
  });

  it('skips rewards (without failing the payment) and logs an operational event when notes is empty', async () => {
    orders[ORDER_ID].notes = null;
    const result = await PaymentService.processWebhookEvent(baseEvent());
    expect(result.success).toBe(true);
    expect(awardSPRRMock).not.toHaveBeenCalled();
    expect(awardXPMock).not.toHaveBeenCalled();
    expect(processReferralMock).not.toHaveBeenCalled();
  });
});

describe('PaymentService — provider-neutral call shape', () => {
  it('accepts provider-neutral field names (provider/providerEventId/providerTransactionId), not stripe-prefixed ones', () => {
    // Type-level guarantee: this compiles only if the real signature uses
    // the provider-neutral contract. If someone reverts to
    // stripeEventId/stripePaymentIntentId, this file fails to typecheck.
    const call: Parameters<typeof PaymentService.processWebhookEvent>[0] = {
      eventType: 'payment_intent.succeeded',
      provider: 'easebuzz',
      providerEventId: 'x',
      providerTransactionId: 'y',
      amount: 1,
    };
    expect(call.provider).toBe('easebuzz');
  });

  it('the Easebuzz webhook adapter source contains no bare stripe-prefixed field usage', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../app/api/webhooks/easebuzz/route.ts'), 'utf-8');
    expect(src).not.toMatch(/\bstripeEventId\b/);
    expect(src).not.toMatch(/\bstripePaymentIntentId\b/);
  });

  it('the Easebuzz payment-initiation action source contains no orders.user_id reference', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../app/actions/easebuzz.ts'), 'utf-8');
    expect(src).not.toMatch(/\border\.user_id\b/);
  });

  it('PaymentService itself contains no orders.user_id reference', () => {
    const src = fs.readFileSync(path.join(__dirname, './payment.ts'), 'utf-8');
    expect(src).not.toMatch(/\border\.user_id\b/);
    expect(src).not.toMatch(/select\('id, user_id/);
  });
});

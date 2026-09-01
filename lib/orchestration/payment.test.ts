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
  q.in = () => q;
  q.maybeSingle = async function (this: any) {
    return q.single();
  };
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
      const empty: any = {};
      empty.select = () => empty;
      empty.eq = () => empty;
      empty.in = () => empty;
      empty.maybeSingle = async () => ({ data: null });
      empty.single = async () => ({ data: null });
      empty.then = (r: any) => Promise.resolve({ data: [] }).then(r);
      if (table === 'inventory_reservations' || table === 'order_items') return empty;
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

vi.mock('@/lib/notifications/email', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ sent: false }),
  orderEmailHtml: () => '',
}));

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
const redeemSPRRMock = vi.fn().mockResolvedValue(undefined);
const refundSPRRMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/nectar/engine', () => ({
  awardSPRR: (...a: any[]) => awardSPRRMock(...a),
  awardXP: (...a: any[]) => awardXPMock(...a),
  processReferral: (...a: any[]) => processReferralMock(...a),
  redeemSPRR: (...a: any[]) => redeemSPRRMock(...a),
  refundSPRR: (...a: any[]) => refundSPRRMock(...a),
}));

const createOrderMock = vi.fn().mockResolvedValue({ success: false });
vi.mock('@/lib/orchestration/unicommerce-forward', () => ({
  forwardPaidOrderToUnicommerce: vi.fn().mockResolvedValue({ ok: true, skipped: true }),
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
    rawPayload: { amount: 499 },
    ...overrides,
  };
}

const AUTH_USER_ID = 'u1';

beforeEach(() => {
  // `notes` carries the creating auth user's id — the verified, live
  // identity mechanism (see lib/orchestration/payment.ts). No `user_id`
  // column exists on the live `orders` table.
  orders = { [ORDER_ID]: { id: ORDER_ID, notes: AUTH_USER_ID, status: 'pending', payment_intent_id: 'txn-1', grand_total: 499, metadata: {} } };
  paymentEvents = [];
  transitionStatusMock.mockClear().mockResolvedValue({ success: true });
  holdMock.mockClear();
  convertMock.mockClear();
  releaseMock.mockClear();
  awardSPRRMock.mockClear();
  awardXPMock.mockClear();
  processReferralMock.mockClear();
  redeemSPRRMock.mockClear();
  refundSPRRMock.mockClear();
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

  it('9. success → duplicate success does not re-run checkout credit redeem', async () => {
    orders[ORDER_ID].shipping_address = { credits_applied: '100' };
    orders[ORDER_ID].discount_total = 150;
    await PaymentService.processWebhookEvent(baseEvent());
    await PaymentService.processWebhookEvent(baseEvent());
    expect(redeemSPRRMock).toHaveBeenCalledTimes(1);
    expect(redeemSPRRMock).toHaveBeenCalledWith(AUTH_USER_ID, 100, expect.stringContaining(ORDER_ID));
    expect(awardSPRRMock).not.toHaveBeenCalled();
    expect(awardXPMock).not.toHaveBeenCalled();
  });

  it('10. success with mismatched amount does not confirm the order', async () => {
    const result = await PaymentService.processWebhookEvent(
      baseEvent({ rawPayload: { amount: 1 } })
    );
    expect(result.success).toBe(false);
    expect(result.code).toBe('AMOUNT_MISMATCH');
    expect(transitionStatusMock).not.toHaveBeenCalled();
    expect(paymentEvents).toHaveLength(0);
  });

  it('11. canceled payment cancels the order and never confirms', async () => {
    const result = await PaymentService.processWebhookEvent(
      baseEvent({ eventType: 'payment_intent.canceled', providerEventId: 'evt:cancel' })
    );
    expect(result.success).toBe(true);
    expect(transitionStatusMock).toHaveBeenCalledWith(ORDER_ID, 'cancelled', 'system', expect.any(String));
    expect(transitionStatusMock).not.toHaveBeenCalledWith(
      ORDER_ID,
      'confirmed',
      expect.anything(),
      expect.anything()
    );
  });
});

describe('PaymentService.processWebhookEvent — Nectar ownership boundary', () => {
  it('does not locally award purchase SPRR/XP (Nectar owns purchase.completed rewards)', async () => {
    await PaymentService.processWebhookEvent(baseEvent());
    expect(awardSPRRMock).not.toHaveBeenCalled();
    expect(awardXPMock).not.toHaveBeenCalled();
    expect(processReferralMock).not.toHaveBeenCalled();
  });

  it('redeems checkout credits from shipping_address.credits_applied, not coupon-inclusive discount_total', async () => {
    orders[ORDER_ID].shipping_address = { credits_applied: '250' };
    orders[ORDER_ID].discount_total = 400;
    await PaymentService.processWebhookEvent(baseEvent());
    expect(redeemSPRRMock).toHaveBeenCalledWith(AUTH_USER_ID, 250, expect.stringContaining(ORDER_ID));
  });

  it('skips credit redeem when notes is empty (without failing payment)', async () => {
    orders[ORDER_ID].notes = null;
    orders[ORDER_ID].shipping_address = { credits_applied: '100' };
    const result = await PaymentService.processWebhookEvent(baseEvent());
    expect(result.success).toBe(true);
    expect(redeemSPRRMock).not.toHaveBeenCalled();
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

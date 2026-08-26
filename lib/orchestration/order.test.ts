import { describe, it, expect, vi, beforeEach } from 'vitest';

// OrderService.transitionStatus reads the current row then writes the new
// status. Mock a minimal chainable `orders` query so we can drive
// current-status → target-status combinations directly against the real
// VALID_TRANSITIONS table. This map must mirror the LIVE
// orders_status_check CHECK constraint — verified via `supabase db dump`
// against the actual project (the migration files in this repo describe a
// different, never-applied enum vocabulary and must not be trusted).

let currentRow: { id: string; status: string; notes?: string } | null = null;

const ordersQuery = {
  select: vi.fn(function (this: any) { return this; }),
  eq: vi.fn(function (this: any) { return this; }),
  in: vi.fn(function (this: any) { return this; }),
  maybeSingle: vi.fn(() => Promise.resolve({ data: currentRow })),
  single: vi.fn(() => Promise.resolve({ data: currentRow })),
  update: vi.fn(function (this: any) { return this; }),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: vi.fn(() => ordersQuery) }),
}));

vi.mock('@/lib/notifications/email', () => ({
  sendTransactionalEmail: vi.fn().mockResolvedValue({ sent: false }),
  orderEmailHtml: () => '',
}));

vi.mock('@/lib/products/brand', () => ({
  resolveStorefrontBrandId: vi.fn().mockResolvedValue('brand-1'),
}));

const { OrderService } = await import('./order');

beforeEach(() => {
  currentRow = null;
  // update(...).eq(...).select(...).single() returns the post-update row
  ordersQuery.update.mockImplementation(function (this: any, patch: any) {
    currentRow = { ...(currentRow as any), ...patch };
    return this;
  });
  ordersQuery.single.mockImplementation(() => Promise.resolve({ data: currentRow }));
});

describe('OrderService.transitionStatus — parity with the LIVE orders_status_check constraint', () => {
  it('allows pending → confirmed (the Easebuzz/Stripe success path)', async () => {
    currentRow = { id: 'o1', status: 'pending' };
    const result = await OrderService.transitionStatus('o1', 'confirmed', 'system');
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('confirmed');
  });

  it('allows pending → cancelled (failed/cancelled payment path)', async () => {
    currentRow = { id: 'o1', status: 'pending' };
    const result = await OrderService.transitionStatus('o1', 'cancelled', 'system');
    expect(result.success).toBe(true);
  });

  it('allows confirmed → processing → shipped → delivered', async () => {
    currentRow = { id: 'o1', status: 'confirmed' };
    expect((await OrderService.transitionStatus('o1', 'processing', 'system')).success).toBe(true);
    expect((await OrderService.transitionStatus('o1', 'shipped', 'system')).success).toBe(true);
    expect((await OrderService.transitionStatus('o1', 'delivered', 'system')).success).toBe(true);
  });

  it('rejects the unapplied migration-file vocabulary ("pending_payment"/"draft"/"on_hold") as a source status', async () => {
    // Guards against ever re-introducing the vocabulary that does not exist
    // in the live orders_status_check constraint — inserting/transitioning
    // to any of these against the real DB throws a CHECK-violation error.
    for (const bogus of ['pending_payment', 'draft', 'on_hold']) {
      currentRow = { id: 'o1', status: bogus };
      const result = await OrderService.transitionStatus('o1', 'confirmed', 'system');
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_TRANSITION');
    }
  });

  it('rejects an invalid transition (confirmed → pending)', async () => {
    currentRow = { id: 'o1', status: 'confirmed' };
    const result = await OrderService.transitionStatus('o1', 'pending', 'system');
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_TRANSITION');
  });

  it('rejects transitions from terminal states (cancelled → anything)', async () => {
    currentRow = { id: 'o1', status: 'cancelled' };
    const result = await OrderService.transitionStatus('o1', 'confirmed', 'system');
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_TRANSITION');
  });

  it('does not overwrite orders.notes (auth user id) with payment audit strings', async () => {
    currentRow = { id: 'o1', status: 'pending', notes: 'auth-user-uuid' };
    const result = await OrderService.transitionStatus(
      'o1',
      'confirmed',
      'system',
      'payment:payment_intent.succeeded'
    );
    expect(result.success).toBe(true);
    expect(result.data?.notes).toBe('auth-user-uuid');
  });
});

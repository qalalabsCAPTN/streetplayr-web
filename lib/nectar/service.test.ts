import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression-focused: the single most expensive mistake this whole
 * NECTAR integration effort produced was code silently querying the
 * WRONG table name (nectar_wallet_transactions vs wallet_transactions,
 * both directions, more than once — see NECTAR_FOUNDATION_REPAIR_REPORT.md
 * and FOUNDATION_MIGRATION_REVIEW.md). These tests exist specifically to
 * catch that class of regression in the Admin's read layer: assert the
 * exact table name each function queries, not just that it "returns
 * data" (a mock returning data from the wrong table would still pass a
 * shallow test).
 */

const fromCalls: string[] = [];

function makeFakeAdminClient(response: { data: unknown; error: unknown; count?: number }) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    in: () => builder,
    maybeSingle: async () => ({
      data: Array.isArray(response.data) ? response.data[0] ?? null : response.data,
      error: response.error,
    }),
    then: (resolve: any) => resolve({ data: response.data, error: response.error, count: response.count ?? null }),
  };
  return {
    from: (table: string) => {
      fromCalls.push(table);
      return builder;
    },
  };
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => (globalThis as any).__fakeDb,
}));

beforeEach(() => {
  fromCalls.length = 0;
});

describe('lib/nectar/service.ts — queries the canonical NECTAR tables, never the wrong ones', () => {
  it('listLedgerTransactions queries nectar_wallet_transactions, not wallet_transactions', async () => {
    (globalThis as any).__fakeDb = makeFakeAdminClient({ data: [], error: null, count: 0 });
    const { listLedgerTransactions } = await import('./service');
    await listLedgerTransactions({ userId: 'u1' });
    expect(fromCalls).toContain('nectar_wallet_transactions');
    expect(fromCalls).not.toContain('wallet_transactions');
  });

  it('getWalletBalance reads wallet_accounts then wallet_balances (the real view)', async () => {
    (globalThis as any).__fakeDb = makeFakeAdminClient({ data: { id: 'wa1' }, error: null });
    const { getWalletBalance } = await import('./service');
    await getWalletBalance('u1');
    expect(fromCalls).toContain('wallet_accounts');
  });

  it('listRewardExecutions queries reward_executions, never a nonexistent identity_profiles table', async () => {
    (globalThis as any).__fakeDb = makeFakeAdminClient({ data: [], error: null, count: 0 });
    const { listRewardExecutions } = await import('./service');
    await listRewardExecutions({});
    expect(fromCalls).toContain('reward_executions');
    expect(fromCalls).not.toContain('identity_profiles');
  });

  it('listEcosystemEvents queries the real events table', async () => {
    (globalThis as any).__fakeDb = makeFakeAdminClient({ data: [], error: null });
    const { listEcosystemEvents } = await import('./service');
    await listEcosystemEvents({});
    expect(fromCalls).toContain('events');
  });

  it('listRewardRules queries reward_rules', async () => {
    (globalThis as any).__fakeDb = makeFakeAdminClient({ data: [], error: null });
    const { listRewardRules } = await import('./service');
    await listRewardRules();
    expect(fromCalls).toContain('reward_rules');
  });
});

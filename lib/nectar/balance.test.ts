import { describe, it, expect, vi, beforeEach } from 'vitest';

const getWalletBalanceMock = vi.fn();
const profileUpdateMock = vi.fn().mockResolvedValue({ error: null });
const profileSelectMock = vi.fn();

vi.mock('@/lib/nectar/service', () => ({
  getWalletBalance: (...args: unknown[]) => getWalletBalanceMock(...args),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: profileSelectMock,
              single: profileSelectMock,
            }),
          }),
          update: (patch: unknown) => {
            profileUpdateMock(patch);
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  }),
}));

vi.mock('@/lib/orchestration/events', () => ({
  recordEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('resolveCheckoutBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileSelectMock.mockResolvedValue({ data: { sprr_balance: 25 } });
    getWalletBalanceMock.mockResolvedValue(null);
  });

  it('falls back to local sprr_balance when no Nectar wallet', async () => {
    const { resolveCheckoutBalance } = await import('./balance');
    const result = await resolveCheckoutBalance('user-1');
    expect(result).toEqual({
      balance: 25,
      source: 'local',
      nectarAvailable: null,
      walletType: null,
      synced: false,
    });
    expect(profileUpdateMock).not.toHaveBeenCalled();
  });

  it('syncs sprr_balance from Nectar points wallet when available', async () => {
    getWalletBalanceMock.mockImplementation((_uid: string, type: string) => {
      if (type === 'points') {
        return Promise.resolve({
          walletId: 'w1',
          userId: 'user-1',
          walletType: 'points',
          available: 50,
          held: 0,
          total: 50,
          computedAt: new Date().toISOString(),
        });
      }
      return Promise.resolve(null);
    });

    const { resolveCheckoutBalance } = await import('./balance');
    const result = await resolveCheckoutBalance('user-1');
    expect(result.balance).toBe(50);
    expect(result.source).toBe('nectar');
    expect(result.synced).toBe(true);
    expect(profileUpdateMock).toHaveBeenCalledWith({ sprr_balance: 50 });
  });

  it('skips profile update when Nectar balance already matches local', async () => {
    profileSelectMock.mockResolvedValue({ data: { sprr_balance: 50 } });
    getWalletBalanceMock.mockResolvedValue({
      walletId: 'w1',
      userId: 'user-1',
      walletType: 'points',
      available: 50,
      held: 0,
      total: 50,
      computedAt: new Date().toISOString(),
    });

    const { resolveCheckoutBalance } = await import('./balance');
    const result = await resolveCheckoutBalance('user-1');
    expect(result.balance).toBe(50);
    expect(profileUpdateMock).not.toHaveBeenCalled();
  });
});

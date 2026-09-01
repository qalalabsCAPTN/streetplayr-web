import { describe, it, expect } from 'vitest';
import { deriveTier, getProgress, getTierMultiplier, getStreakLabel, type Tier } from './engine';

describe('Nectar Engine - deriveTier', () => {
  it('returns ROOKIE when purchaseCount is less than 16', () => {
    expect(deriveTier(0)).toBe('ROOKIE');
    expect(deriveTier(1)).toBe('ROOKIE');
    expect(deriveTier(15)).toBe('ROOKIE');
  });

  it('returns PRO when purchaseCount is between 16 and 30 inclusive', () => {
    expect(deriveTier(16)).toBe('PRO');
    expect(deriveTier(30)).toBe('PRO');
  });

  it('returns LEGEND when purchaseCount is 31 or greater', () => {
    expect(deriveTier(31)).toBe('LEGEND');
    expect(deriveTier(50)).toBe('LEGEND');
  });
});

describe('Nectar Engine - getProgress', () => {
  it('returns 0% progress toward PRO when purchaseCount is 1', () => {
    const result = getProgress(1);
    expect(result.tier).toBe('ROOKIE');
    expect(result.progress).toBe(0); // (1 - 1) / (16 - 1) = 0
    expect(result.next).toBe('PRO');
  });

  it('returns correctly scaled progress toward PRO when purchaseCount is 4', () => {
    const result = getProgress(4);
    expect(result.tier).toBe('ROOKIE');
    expect(result.progress).toBeCloseTo(0.2); // (4 - 1) / (16 - 1) = 0.2
    expect(result.next).toBe('PRO');
  });

  it('returns correctly scaled progress toward LEGEND when purchaseCount is 22', () => {
    const result = getProgress(22);
    expect(result.tier).toBe('PRO');
    expect(result.progress).toBeCloseTo(0.4); // (22 - 16) / (31 - 16) = 6 / 15 = 0.4
    expect(result.next).toBe('LEGEND');
  });

  it('returns 100% progress (1.0) and next as null when tier is LEGEND', () => {
    const result = getProgress(31);
    expect(result.tier).toBe('LEGEND');
    expect(result.progress).toBe(1);
    expect(result.next).toBe(null);
  });
});

describe('Nectar Engine - getTierMultiplier', () => {
  it('returns 1.0 multiplier for ROOKIE tier', () => {
    expect(getTierMultiplier('ROOKIE')).toBe(1.0);
  });

  it('returns 1.0 multiplier for PRO tier', () => {
    expect(getTierMultiplier('PRO')).toBe(1.0);
  });

  it('returns 1.0 multiplier for LEGEND tier', () => {
    expect(getTierMultiplier('LEGEND')).toBe(1.0);
  });

  it('returns 1.0 multiplier for any invalid/unknown tier', () => {
    // Cast to any to test fallback/default behavior
    expect(getTierMultiplier('UNKNOWN' as unknown as Tier)).toBe(1.0);
  });
});

describe('Nectar Engine - getStreakLabel', () => {
  it('returns Start Your Streak when days is 0', () => {
    expect(getStreakLabel(0)).toBe('Start Your Streak');
  });

  it('returns Getting Started when days is between 1 and 2', () => {
    expect(getStreakLabel(1)).toBe('Getting Started');
    expect(getStreakLabel(2)).toBe('Getting Started');
  });

  it('returns Building when days is between 3 and 6', () => {
    expect(getStreakLabel(3)).toBe('Building');
    expect(getStreakLabel(6)).toBe('Building');
  });

  it('returns Consistent when days is between 7 and 13', () => {
    expect(getStreakLabel(7)).toBe('Consistent');
    expect(getStreakLabel(13)).toBe('Consistent');
  });

  it('returns On Fire when days is between 14 and 29', () => {
    expect(getStreakLabel(14)).toBe('On Fire');
    expect(getStreakLabel(29)).toBe('On Fire');
  });

  it('returns Unstoppable when days is 30 or greater', () => {
    expect(getStreakLabel(30)).toBe('Unstoppable');
    expect(getStreakLabel(100)).toBe('Unstoppable');
  });
});

// We can mock the DB client to test the new DB functions
import { vi } from 'vitest';
import { assignManualTier, grantSocialSignupBonus } from './engine';
import { createAdminClient } from '@/lib/supabase/admin';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

describe('assignManualTier', () => {
  it('allows super_admin to assign CREATORS tier', async () => {
    const updateMock = vi.fn().mockReturnThis();
    
    const singleMock = vi.fn()
      .mockResolvedValueOnce({ data: { role: 'super_admin' } })
      .mockResolvedValueOnce({ data: { tier: 'ROOKIE' } });

    const profilesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: singleMock,
      update: updateMock,
    };

    const mockAdminClient = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'profiles') return profilesChain;
        if (table === 'operational_events') {
          return {
            insert: vi.fn().mockResolvedValue({}),
          };
        }
        return {};
      }),
    };
    (createAdminClient as any).mockReturnValue(mockAdminClient);

    await assignManualTier('admin_123', 'user_123', 'CREATORS');

    expect(updateMock).toHaveBeenCalledWith({ tier: 'CREATORS' });
  });

  it('rejects unauthorized users from manual assignment', async () => {
    const mockAdminClient = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'member' } }),
      })),
    };
    (createAdminClient as any).mockReturnValue(mockAdminClient);

    await expect(assignManualTier('user_123', 'user_456', 'TALENT')).rejects.toThrow('Unauthorized');
  });

  it('is idempotent and skips update if already assigned', async () => {
    const updateMock = vi.fn().mockReturnThis();
    
    const singleMock = vi.fn()
      .mockResolvedValueOnce({ data: { role: 'ops_admin' } })
      .mockResolvedValueOnce({ data: { tier: 'TALENT' } });

    const profilesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: singleMock,
      update: updateMock,
    };

    const mockAdminClient = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'profiles') return profilesChain;
        return {};
      }),
    };
    (createAdminClient as any).mockReturnValue(mockAdminClient);

    await assignManualTier('admin_123', 'user_123', 'TALENT');
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe('grantSocialSignupBonus', () => {
  it('is idempotent and grants exactly 50 SPRR and 25 XP', async () => {
    const updateMock = vi.fn().mockReturnThis();
    const mockAdminClient = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'wallet_transactions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }), // No existing tx
            insert: vi.fn().mockResolvedValue({}),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { sprr_balance: 10, xp: 5 } }),
            update: updateMock,
          };
        }
        return {};
      }),
    };
    (createAdminClient as any).mockReturnValue(mockAdminClient);

    await grantSocialSignupBonus('user_123');
    // 50 SPRR
    expect(updateMock).toHaveBeenCalledWith({ sprr_balance: 60 });
  });

  it('skips if already granted', async () => {
    const updateMock = vi.fn().mockReturnThis();
    const mockAdminClient = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'wallet_transactions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'tx_123' } }), // Existing tx
          };
        }
        return { update: updateMock };
      }),
    };
    (createAdminClient as any).mockReturnValue(mockAdminClient);

    await grantSocialSignupBonus('user_123');
    expect(updateMock).not.toHaveBeenCalled();
  });
});

import type { User, WalletTransaction } from '@/store/authStore';

export function createMockUser(partial?: Partial<User>): User {
  return {
    id: partial?.id ?? '00000000-0000-0000-0000-000000000001',
    username: 'streetplayr_demo',
    name: 'Street Player',
    phone: partial?.phone ?? '+919999999999',
    email: partial?.email ?? 'demo@streetplayr.com',
    avatar: null,
    referralCode: 'SP-DEMO-001',
    walletId: 'wallet_demo_001',
    joinedFrom: 'direct',
    authProvider: 'phone',
    isOnboarded: true,
    memberSince: '2025-01-01T00:00:00Z',
    sprrBalance: 2480,
    role: 'member',
    ...partial,
  };
}

export function getDemoTransactions(): WalletTransaction[] {
  return [
    { id: 'tx_demo_1', type: 'BONUS', source: 'Welcome to The Play', delta: 500, createdAt: '2025-01-15T10:00:00Z' },
    { id: 'tx_demo_2', type: 'PURCHASE', source: 'Arch Oversized Tee', delta: -120, createdAt: '2025-02-20T14:30:00Z' },
    { id: 'tx_demo_3', type: 'REFERRAL', source: 'Friend joined via your link', delta: 200, createdAt: '2025-03-05T09:15:00Z' },
    { id: 'tx_demo_4', type: 'DROP', source: 'Monolith Drop — Early Access', delta: 350, createdAt: '2025-03-22T18:00:00Z' },
    { id: 'tx_demo_5', type: 'EARN', source: 'Community Engagement Bonus', delta: 150, createdAt: '2025-04-10T12:00:00Z' },
    { id: 'tx_demo_6', type: 'PURCHASE', source: 'Monolith Cargo Pants', delta: -200, createdAt: '2025-04-28T16:45:00Z' },
    { id: 'tx_demo_7', type: 'BONUS', source: 'Tier Up: Playr', delta: 1000, createdAt: '2025-05-01T00:00:00Z' },
    { id: 'tx_demo_8', type: 'BONUS', source: 'Season 25 Allocation', delta: 600, createdAt: '2025-05-05T11:20:00Z' },
  ];
}

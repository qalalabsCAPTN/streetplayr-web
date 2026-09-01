'use client';

import { useAuthStore, type User, type WalletTransaction } from '@/store/authStore';

/**
 * Demo-mode auth — used when Supabase env vars are not configured.
 * Signs a demo member into the client auth store (persisted to
 * localStorage) so the whole account section works without a live backend.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DEMO_TRANSACTIONS: WalletTransaction[] = [
  { id: 'tx-demo-4', type: 'PURCHASE', source: 'Drop 001 purchase reward', delta: 190, createdAt: '2026-07-12T10:20:00.000Z' },
  { id: 'tx-demo-3', type: 'REFERRAL', source: 'Referral joined — @street.arjun', delta: 500, createdAt: '2026-07-08T18:05:00.000Z' },
  { id: 'tx-demo-2', type: 'SPEND', source: 'Redeemed — Early access pass', delta: -500, createdAt: '2026-07-05T09:00:00.000Z' },
  { id: 'tx-demo-1', type: 'BONUS', source: 'Welcome bonus', delta: 50, createdAt: '2026-05-04T12:00:00.000Z' },
];

export function demoLogin({
  name,
  email,
  phone,
  provider = 'google',
}: {
  name?: string;
  email?: string;
  phone?: string;
  provider?: 'google' | 'phone';
} = {}) {
  const displayName =
    name ||
    (email ? email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '') ||
    'Creative PlayR';

  const user: User = {
    id: 'demo-user-001',
    username: displayName.toLowerCase().replace(/\s+/g, '.'),
    name: displayName,
    phone: phone || '+91 98765 43210',
    email: email || 'creative@streetplayr.in',
    avatar: null,
    referralCode: 'PLAYR-D8AC8B',
    walletId: 'WLT-0001',
    tier: 'ROOKIE',
    joinedFrom: 'organic',
    authProvider: provider,
    isOnboarded: true,
    memberSince: '2026-05-04T00:00:00.000Z',
    sprrBalance: 240,
    role: 'member',
  };

  useAuthStore.getState().sync(user, DEMO_TRANSACTIONS);
}

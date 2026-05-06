import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Tier Derivation ────────────────────────────────────────────────────────
export type Tier = 'STREET' | 'PLAYER' | 'LEGEND';

export function deriveTier(balance: number): Tier {
  if (balance >= 5000) return 'LEGEND';
  if (balance >= 500) return 'PLAYER';
  return 'STREET';
}

export const TIER_THRESHOLDS: Record<Tier, { min: number; max: number | null; label: string; next: Tier | null }> = {
  STREET: { min: 0, max: 500, label: 'Street', next: 'PLAYER' },
  PLAYER: { min: 500, max: 5000, label: 'Playr', next: 'LEGEND' },
  LEGEND: { min: 5000, max: null, label: 'Legend', next: null },
};

// ─── Wallet Transaction ──────────────────────────────────────────────────────
export type WalletTransactionType =
  | 'EARN'
  | 'SPEND'
  | 'REFERRAL'
  | 'BONUS'
  | 'PURCHASE'
  | 'DROP';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  source: string;    // Human label: "Welcome Bonus", "Order #SP-001", etc.
  delta: number;     // Positive = earn, negative = spend
  createdAt: string; // ISO date string
}

// ─── User Model ──────────────────────────────────────────────────────────────
export type AuthProvider = 'phone' | 'google';

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string | null;
  avatar: string | null;
  referralCode: string;    // future: referral engine
  walletId: string;        // future: wallet economy service
  joinedFrom: string;      // referral source tracking
  authProvider: AuthProvider;
  isOnboarded: boolean;
  memberSince: string;     // ISO date string
  sprrBalance: number;
}

// ─── Store State ─────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  transactions: WalletTransaction[];
  isAuthenticated: boolean;
  isHydrated: boolean; // prevents navbar flicker / flash

  // Actions
  login: (user: User, initialTransactions?: WalletTransaction[]) => void;
  logout: () => void;
  updateProfile: (partial: Partial<Pick<User, 'name' | 'email' | 'username' | 'isOnboarded'>>) => void;
  addTransaction: (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => void;
  setHydrated: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateReferralCode(name: string): string {
  const base = name.replace(/\s+/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ─── Default Welcome Transactions ────────────────────────────────────────────
function createWelcomeTransactions(): WalletTransaction[] {
  return [
    {
      id: generateId('tx'),
      type: 'BONUS',
      source: 'Welcome to StreetPlayR',
      delta: 200,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId('tx'),
      type: 'DROP',
      source: 'SS25 Drop Access Granted',
      delta: 100,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ];
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      transactions: [],
      isAuthenticated: false,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      login: (user, initialTransactions) => {
        set({
          user,
          isAuthenticated: true,
          transactions: initialTransactions ?? createWelcomeTransactions(),
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          transactions: [],
        });
      },

      updateProfile: (partial) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...partial } });
      },

      addTransaction: (tx) => {
        const newTx: WalletTransaction = {
          ...tx,
          id: generateId('tx'),
          createdAt: new Date().toISOString(),
        };
        const current = get().user;
        if (!current) return;

        // Update sprrBalance
        const newBalance = Math.max(0, current.sprrBalance + tx.delta);
        set({
          user: { ...current, sprrBalance: newBalance },
          transactions: [newTx, ...get().transactions],
        });
      },
    }),
    {
      name: 'streetplayr-auth',
      onRehydrateStorage: () => (state) => {
        // Called after Zustand rehydrates from localStorage
        state?.setHydrated();
      },
    }
  )
);

// ─── Selector Helpers ─────────────────────────────────────────────────────────
export const selectTier = (state: AuthState) =>
  state.user ? deriveTier(state.user.sprrBalance) : null;

export const selectTierProgress = (state: AuthState): number => {
  if (!state.user) return 0;
  const tier = deriveTier(state.user.sprrBalance);
  const { min, max } = TIER_THRESHOLDS[tier];
  if (max === null) return 1; // LEGEND is max
  return Math.min(1, (state.user.sprrBalance - min) / (max - min));
};

// ─── Mock User Factory ────────────────────────────────────────────────────────
export function createMockUser(
  name: string,
  phone: string,
  provider: AuthProvider,
  email?: string
): User {
  return {
    id: generateId('usr'),
    username: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 999),
    name,
    phone,
    email: email ?? null,
    avatar: null,
    referralCode: generateReferralCode(name),
    walletId: generateId('wlt'),
    joinedFrom: 'organic',
    authProvider: provider,
    isOnboarded: false,
    memberSince: new Date().toISOString(),
    sprrBalance: 300, // starts in STREET tier
  };
}

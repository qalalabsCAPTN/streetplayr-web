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

/**
 * OpsOS role hierarchy — ordered by privilege level.
 * Future-safe segmentation for production RBAC.
 */
export type UserRole =
  | 'super_admin'
  | 'ops_admin'
  | 'fulfillment'
  | 'editorial'
  | 'support'
  | 'viewer'
  | 'member';

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
  role: UserRole;
}

// ─── Store State ─────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  transactions: WalletTransaction[];
  isAuthenticated: boolean;
  isHydrated: boolean; // Zustand rehydration from local storage
  isLoading: boolean;  // Supabase session check in progress

  // Actions
  setHydrated: () => void;
  setLoading: (loading: boolean) => void;
  sync: (user: User | null, transactions?: WalletTransaction[]) => void;
  logout: () => void;
  updateProfile: (partial: Partial<Pick<User, 'name' | 'email' | 'username' | 'isOnboarded'>>) => void;
  addTransaction: (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => void;
}


// ─── Store ───────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      transactions: [],
      isAuthenticated: false,
      isHydrated: false,
      isLoading: true, // Start in loading state until sync happens

      setHydrated: () => set({ isHydrated: true }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      sync: (user, transactions) => {
        set({
          user,
          isAuthenticated: !!user,
          transactions: transactions ?? get().transactions,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          transactions: [],
          isLoading: false,
        });
      },

      updateProfile: (partial) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...partial } });
      },

      addTransaction: (tx) => {
        const id = `tx_${Date.now()}`;
        const newTx: WalletTransaction = {
          ...tx,
          id,
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

const OPS_ADMIN_ROLES: UserRole[] = ['super_admin', 'ops_admin'];
const OPS_ALL_ROLES: UserRole[] = ['super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer'];

export const selectIsOpsRole = (state: AuthState) => {
  const role = state.user?.role;
  return OPS_ALL_ROLES.includes(role as UserRole);
};

export const selectIsOpsAdmin = (state: AuthState) => {
  const role = state.user?.role;
  return OPS_ADMIN_ROLES.includes(role as UserRole);
};

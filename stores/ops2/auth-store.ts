import { create } from 'zustand';
import type { OpsUser, OpsUserRole, Permission } from '@/types/ops2/ops';
import { ROLE_PERMISSIONS } from '@/types/ops2/ops';

interface AuthStore {
  user: OpsUser | null;
  isLoaded: boolean;
  setUser: (user: OpsUser | null) => void;
  can: (permission: Permission) => boolean;
  hasRole: (role: OpsUserRole | OpsUserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isLoaded: false,

  setUser: (user) => set({ user, isLoaded: true }),

  can: (permission: Permission) => {
    const { user } = get();
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  },

  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  },
}));

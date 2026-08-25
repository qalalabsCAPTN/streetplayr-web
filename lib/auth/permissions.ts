import { UserRole } from './gateway';

/**
 * Permission definitions for OpsOS RBAC.
 *
 * Maps roles to resource-level permissions.
 * Used by gateway, middleware, and components.
 */
export type Permission =
  | 'ops:access'
  | 'products:view'
  | 'products:create'
  | 'products:edit'
  | 'products:archive'
  | 'drops:view'
  | 'drops:create'
  | 'drops:schedule'
  | 'drops:publish'
  | 'orders:view'
  | 'orders:fulfill'
  | 'orders:cancel'
  | 'orders:refund'
  | 'orders:edit'
  | 'customers:view'
  | 'customers:edit'
  | 'wallet:view'
  | 'wallet:adjust'
  | 'content:edit'
  | 'content:publish'
  | 'users:manage_roles'
  | 'system:configure'
  | 'reports:view'
  // NECTAR ecosystem — read-only for now (Phase 7: "read-side first").
  // No 'nectar:*_write' permission exists yet because there is no
  // Admin-side write path into NECTAR's ledger/reward tables — see
  // lib/nectar/service.ts's header comment. Add one only alongside a
  // real write seam, not before.
  | 'nectar:view';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'ops:access', 'products:view', 'products:create', 'products:edit', 'products:archive',
    'drops:view', 'drops:create', 'drops:schedule', 'drops:publish',
    'orders:view', 'orders:fulfill', 'orders:cancel', 'orders:refund', 'orders:edit',
    'customers:view', 'customers:edit',
    'wallet:view', 'wallet:adjust',
    'content:edit', 'content:publish',
    'users:manage_roles', 'system:configure', 'reports:view',
    'nectar:view',
  ],
  ops_admin: [
    'ops:access', 'products:view', 'products:create', 'products:edit',
    'drops:view', 'drops:create', 'drops:schedule', 'drops:publish',
    'orders:view', 'orders:fulfill', 'orders:cancel', 'orders:refund', 'orders:edit',
    'customers:view', 'customers:edit',
    'wallet:view', 'wallet:adjust',
    'reports:view',
    'nectar:view',
  ],
  fulfillment: [
    'ops:access', 'products:view',
    'drops:view',
    'orders:view', 'orders:fulfill',
    'customers:view',
    'reports:view',
  ],
  editorial: [
    'ops:access', 'products:view', 'products:create', 'products:edit',
    'drops:view', 'drops:create', 'drops:schedule',
    'content:edit', 'content:publish',
    'reports:view',
  ],
  support: [
    'ops:access', 'products:view',
    'drops:view', 'orders:view', 'orders:cancel',
    'customers:view', 'customers:edit',
    'wallet:view',
    'reports:view',
    'nectar:view',
  ],
  viewer: [
    'ops:access', 'products:view',
    'drops:view',
    'reports:view',
    'nectar:view',
  ],
  member: [],
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

export function roleHasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * All roles that have access to OpsOS.
 */
export const OPS_ROLES: UserRole[] = [
  'super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer',
];

export function isOpsRole(role: UserRole): boolean {
  return OPS_ROLES.includes(role);
}

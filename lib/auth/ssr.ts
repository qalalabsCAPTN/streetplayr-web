/**
 * SSR/Auth Stability Utilities
 *
 * Helpers for consistent session handling across server components,
 * server actions, and API routes. Centralizes auth verification
 * so that every server entry point uses the same pattern.
 */
import { createClient } from '@/lib/supabase/server';
import { AuthGateway } from '@/lib/auth/gateway';
import type { UserRole } from '@/lib/auth/gateway';

export interface SSRUser {
  id: string;
  role: UserRole;
}

/**
 * Get the authenticated user for SSR (page/layout server components).
 * Returns null if not authenticated.
 * Never throws — always returns null on error.
 */
export async function getSSRUser(): Promise<SSRUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const role = await AuthGateway.resolveRole(user.id);
    return { id: user.id, role };
  } catch {
    return null;
  }
}

/**
 * Get the authenticated user for a server action.
 * Returns error response if not authenticated,
 * allowing server actions to return early with a standard error.
 */
export async function requireSSRAuth(): Promise<
  { user: SSRUser } | { error: { success: false; error: string; code: string } }
> {
  const user = await getSSRUser();
  if (!user) {
    return { error: { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' } };
  }
  return { user };
}

/**
 * Require a specific role for a server action.
 * Returns error response if not authorized.
 */
export async function requireSSRRole(
  allowedRoles: UserRole[]
): Promise<
  { user: SSRUser } | { error: { success: false; error: string; code: string } }
> {
  const result = await requireSSRAuth();
  if ('error' in result) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return { error: { success: false, error: 'Insufficient permissions.', code: 'FORBIDDEN' } };
  }

  return result;
}

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOpsRole } from './permissions';

/**
 * Authoritative user role type for the StreetPlayR RBAC system.
 */
export type UserRole =
  | 'super_admin'
  | 'ops_admin'
  | 'fulfillment'
  | 'editorial'
  | 'support'
  | 'viewer'
  | 'member';

/**
 * Auth decision — result of evaluating a request against auth rules.
 */
export type AuthDecision =
  | { action: 'allow' }
  | { action: 'redirect'; location: string }
  | { action: 'deny' };

/**
 * Auth Gateway — centralized auth orchestration layer.
 *
 * Responsibilities:
 * - Role resolution (via admin client)
 * - Protected route checking
 * - Role-based route gating
 * - Auth decision building for middleware/proxy
 *
 * This is the ONLY file that middleware.ts and proxy.ts import.
 * All auth orchestration logic lives here.
 *
 * Session verification is handled by lib/supabase/middleware.ts (refreshSession)
 * and passed into the gateway as a pre-verified userId.
 */
export const AuthGateway = {
  /**
   * Resolve role for a user ID using admin client.
   * Falls back to 'member' on error.
   */
  async resolveRole(userId: string): Promise<UserRole> {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      return (data?.role as UserRole) || 'member';
    } catch {
      return 'member';
    }
  },

  /**
   * Check if a pathname requires authentication.
   */
  isProtectedRoute(pathname: string): boolean {
    // '/profile' intentionally excluded: gated client-side by <ProfileGuard>,
    // which renders an in-place Bluorng-style sign-in panel instead of a
    // hard redirect. Do not add it back here without updating ProfileGuard.
    return (
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/cart') ||
      pathname.startsWith('/ops')
    );
  },

  /**
   * Check if a pathname requires OpsOS role access.
   */
  isOpsRoute(pathname: string): boolean {
    return pathname.startsWith('/ops');
  },

  /**
   * Build the auth decision for a given request.
   * This is the main entry point for middleware/proxy.
   *
   * Called AFTER session refresh. Receives pre-verified userId.
   *
   * Returns null if the request should proceed normally.
   * Returns a redirect response if auth is required but not satisfied.
   */
  async handleRequest(
    request: NextRequest,
    userId: string | null
  ): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    if (!this.isProtectedRoute(pathname)) {
      return null;
    }

    if (!userId) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Ops routes require OpsOS role
    if (this.isOpsRoute(pathname)) {
      const role = await this.resolveRole(userId);
      if (!isOpsRole(role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    return null;
  },
};

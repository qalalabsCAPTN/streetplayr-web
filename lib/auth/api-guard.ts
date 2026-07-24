import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthGateway, type UserRole } from '@/lib/auth/gateway';
import { OPS_ROLES, isOpsRole } from '@/lib/auth/permissions';

export interface ApiAuthUser {
  id: string;
  role: UserRole;
}

/**
 * Require authenticated user with an OpsOS role for API routes.
 * Returns user or a NextResponse error (401/403).
 */
export async function requireOpsApi(
  allowedRoles: UserRole[] = OPS_ROLES
): Promise<ApiAuthUser | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await AuthGateway.resolveRole(user.id);
  if (!allowedRoles.includes(role) || !isOpsRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { id: user.id, role };
}

export function isApiError(result: ApiAuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

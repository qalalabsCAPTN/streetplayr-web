import { type NextRequest } from 'next/server';
import { refreshSession } from '@/lib/supabase/middleware';
import { AuthGateway } from '@/lib/auth/gateway';

export async function middleware(request: NextRequest) {
  // Step 1: Session refresh (cookie management)
  const { user, response } = await refreshSession(request);

  // Step 2: Auth decision via gateway
  const authResponse = await AuthGateway.handleRequest(request, user?.id ?? null);

  // If auth decision requires a redirect, return it
  if (authResponse) return authResponse;

  // Otherwise proceed with the session-refreshed response
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

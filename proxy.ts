import { type NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '@/lib/supabase/middleware';
import { AuthGateway } from '@/lib/auth/gateway';
import { ENTRY_COOKIE } from '@/lib/social';

const REDIRECT_MAP: Record<string, string> = {
  '/collection': '/collections',
  '/shop': '/collections',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root: first visit → standalone intro; returning visit → home.
  // Manual /entering-street-playR is never redirected — always plays intro.
  if (pathname === '/' || pathname === '') {
    const seen = request.cookies.get(ENTRY_COOKIE)?.value === '1';
    const url = request.nextUrl.clone();
    url.pathname = seen ? '/home' : '/entering-street-playR';
    return NextResponse.redirect(url);
  }

  // Legacy route redirects
  const target = REDIRECT_MAP[pathname];
  if (target) {
    return NextResponse.redirect(new URL(target, request.url));
  }

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

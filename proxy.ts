import { type NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '@/lib/supabase/middleware';
import { AuthGateway } from '@/lib/auth/gateway';
import { ENTRY_COOKIE } from '@/lib/social';

const REDIRECT_MAP: Record<string, string> = {
  '/collection': '/collections',
  '/shop': '/collections',
};

function entryRootRedirect(request: NextRequest, pathname: '/home' | '/entering-street-playR') {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url);
  // Cookie-varying redirect — never let CDN/browser cache the wrong Location.
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie');
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root: first visit → standalone intro; returning visit → home.
  // Manual /entering-street-playR is never redirected — always plays intro.
  // Same flow for every host (streetplayr.com, www, playrstreet.com).
  if (pathname === '/' || pathname === '') {
    const seen = request.cookies.get(ENTRY_COOKIE)?.value === '1';
    return entryRootRedirect(request, seen ? '/home' : '/entering-street-playR');
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
    // Explicit `/` — catch-all alone can miss the root on some Next matchers.
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

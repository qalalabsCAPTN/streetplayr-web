import { type NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '@/lib/supabase/middleware';
import { AuthGateway } from '@/lib/auth/gateway';

const REDIRECT_MAP: Record<string, string> = {
  '/collection': '/collections',
  '/shop': '/collections',
  // Retired standalone preloader — always Home (intro overlays /home).
  '/entering-street-playR': '/home',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/` always serves Home. First-visit video is an overlay on `/home`, not a route.
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.rewrite(url);
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

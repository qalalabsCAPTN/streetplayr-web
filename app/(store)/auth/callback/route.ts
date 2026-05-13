import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ALLOWED_REDIRECT_PATHS = [
  '/',
  '/home',
  '/profile',
  '/profile/wallet',
  '/profile/orders',
  '/profile/addresses',
  '/profile/settings',
  '/cart',
  '/checkout',
];

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.includes('://') || path.includes('..')) return false;
  if (ALLOWED_REDIRECT_PATHS.includes(path)) return true;
  if (path.startsWith('/profile/')) return true;
  if (path.startsWith('/checkout/')) return true;
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const next = nextParam && isValidRedirect(nextParam) ? nextParam : '/profile';

  // Always use NEXT_PUBLIC_SITE_URL for production, fallback to origin for dev
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const baseUrl = siteUrl || new URL(request.url).origin;

  console.log('[AuthCallback] Received:', { hasCode: !!code, next, siteUrl, baseUrl });

  if (code) {
    try {
      const cookieStore = await cookies();
      const pendingCookies: Array<{
        name: string;
        value: string;
        options: Record<string, unknown>;
      }> = [];

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                pendingCookies.push({ name, value, options });
                try {
                  cookieStore.set(name, value, options);
                } catch {
                  // Ignore when called from a Server Component context
                }
              });
            },
          },
        }
      );

      console.log('[AuthCallback] Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[AuthCallback] exchangeCodeForSession error:', error.message);
      } else {
        console.log('[AuthCallback] Session exchange successful, pending cookies:', pendingCookies.length);

        const redirectUrl = `${baseUrl}${next}`;
        console.log('[AuthCallback] Redirecting to:', redirectUrl);

        const response = NextResponse.redirect(redirectUrl);

        // Transfer auth cookies to the redirect response with their
        // original options (path, sameSite, etc.).
        // exchangeCodeForSession sets session cookies via cookieStore.set(),
        // but NextResponse.redirect() creates a fresh response that does not
        // inherit them — without this transfer the browser follows the
        // redirect without auth cookies, the middleware sees no session,
        // and the user appears unauthenticated.
        for (const { name, value, options } of pendingCookies) {
          response.cookies.set(name, value, options);
        }

        return response;
      }
    } catch (e) {
      console.error('[AuthCallback] Exception:', e);
    }
  } else {
    console.log('[AuthCallback] No code in URL params');
  }

  const errorUrl = `${baseUrl}/auth/auth-code-error`;
  console.log('[AuthCallback] Redirecting to error:', errorUrl);
  return NextResponse.redirect(errorUrl);
}

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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const next = nextParam && isValidRedirect(nextParam) ? nextParam : '/profile';

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
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  pendingCookies.push({ name, value, options });
                  cookieStore.set(name, value, options);
                });
              } catch {
                // Ignore when called from a Server Component context
              }
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        const redirectUrl = isLocalEnv
          ? `${origin}${next}`
          : forwardedHost
            ? `https://${forwardedHost}${next}`
            : `${origin}${next}`;

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
      console.error('OAuth callback error:', e);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

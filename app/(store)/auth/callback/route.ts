import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ALLOWED_REDIRECT_PATHS = [
  '/', '/home', '/profile', '/profile/wallet', '/profile/orders',
  '/profile/addresses', '/profile/settings', '/cart', '/checkout',
];

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.includes('://') || path.includes('..')) return false;
  if (ALLOWED_REDIRECT_PATHS.includes(path)) return true;
  if (path.startsWith('/profile/')) return true;
  if (path.startsWith('/checkout/')) return true;
  return false;
}

const debug = process.env.NODE_ENV === 'development' ? (msg: string, ...args: unknown[]) => console.log(`[Auth] ${msg}`, ...args) : () => {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const next = nextParam && isValidRedirect(nextParam) ? nextParam : '/profile';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const baseUrl = siteUrl || new URL(request.url).origin;

  debug('callback received', { hasCode: !!code, next, siteUrl, baseUrl });

  if (code) {
    try {
      const cookieStore = await cookies();
      const pendingCookies: Array<{
        name: string; value: string; options: Record<string, unknown>;
      }> = [];

      const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options });
              try { cookieStore.set(name, value, options); } catch { /* Server Component context */ }
            });
          },
        },
      });

      debug('exchanging code...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[Auth] exchangeCodeForSession error:', error.message);
      } else {
        debug('session exchange successful', pendingCookies.length);
        const response = NextResponse.redirect(`${baseUrl}${next}`);
        for (const { name, value, options } of pendingCookies) {
          response.cookies.set(name, value, options);
        }
        return response;
      }
    } catch (e) {
      console.error('[Auth] callback exception:', e);
    }
  } else {
    debug('no code in URL params');
  }

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}

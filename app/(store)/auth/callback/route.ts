import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { grantWelcomeBonus } from '@/lib/nectar/engine';
import { attributeSignup } from '@/lib/nectar/referrals';

const ALLOWED_REDIRECT_PATHS = [
  '/', '/home', '/profile', '/profile/wallet', '/profile/orders',
  '/profile/addresses', '/profile/settings', '/cart', '/checkout',
  '/dashboard', '/wishlist',
];

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.includes('://') || path.includes('..')) return false;
  if (ALLOWED_REDIRECT_PATHS.includes(path)) return true;
  if (path.startsWith('/profile/')) return true;
  if (path.startsWith('/checkout/')) return true;
  if (path.startsWith('/dashboard/')) return true;
  return false;
}

// Always log in production so Cloud Run logs capture auth failures
const debug = (msg: string, ...args: unknown[]) =>
  console.log(`[Auth] ${msg}`, ...args);


export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const refParam = requestUrl.searchParams.get('ref'); // Referral code passed via OAuth redirect URL
  const next = nextParam && isValidRedirect(nextParam) ? nextParam : '/profile';

  // Dynamic host resolution for local/staging/production proxies
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin;

  debug('Start', {
    requestUrl: request.url,
    code: code ? '***' : null,
    next,
    forwardedHost,
    forwardedProto,
    baseUrl
  });

  if (code) {
    try {
      const cookieStore = await cookies();
      
      // Log verifier cookie presence for debugging PKCE mismatch
      const allReqCookies = cookieStore.getAll();
      const verifierCookie = allReqCookies.find(c => c.name.includes('code-verifier'));
      debug('Verifier cookie check:', {
        found: !!verifierCookie,
        cookieName: verifierCookie?.name,
        totalCookies: allReqCookies.length
      });

      const pendingCookies: Array<{
        name: string; value: string; options: Record<string, unknown>;
      }> = [];

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                pendingCookies.push({ name, value, options });
                try { cookieStore.set(name, value, options); } catch { /* Server Component context */ }
              });
            },
          },
        }
      );

      debug('Exchanging code for session...');
      const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[Auth Callback] exchangeCodeForSession error:', error.message, error);
        return NextResponse.redirect(`${baseUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
      }

      debug('Session exchange successful!', {
        userId: sessionData?.user?.id,
        pendingCookiesCount: pendingCookies.length
      });

      // Post-OAuth hooks (non-blocking)
      const userId = sessionData?.user?.id;
      if (userId) {
        grantWelcomeBonus(userId).catch(err =>
          console.error('[Auth Callback] grantWelcomeBonus failed:', err)
        );

        if (refParam) {
          attributeSignup(refParam, userId).catch(err =>
            console.error('[Auth Callback] attributeSignup failed:', err)
          );
        }
      }

      const redirectDestination = `${baseUrl}${next}`;
      debug('Redirecting to:', redirectDestination);
      const response = NextResponse.redirect(redirectDestination);
      for (const { name, value, options } of pendingCookies) {
        response.cookies.set(name, value, options);
      }
      return response;
    } catch (e: any) {
      console.error('[Auth Callback] Exception during exchange:', e);
      return NextResponse.redirect(`${baseUrl}/auth/auth-code-error?error=${encodeURIComponent(e.message || 'unknown_exception')}`);
    }
  } else {
    console.warn('[Auth Callback] No code parameter found in callback URL.');
  }

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error?error=missing_code`);
}

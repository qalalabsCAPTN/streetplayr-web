import { NextResponse } from 'next/server';
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server';

const ALLOWED_REDIRECT_PATHS = [
  '/profile',
  '/profile/wallet',
  '/profile/orders',
  '/profile/addresses',
  '/profile/settings',
  '/checkout',
  '/home',
  '/',
];

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path.includes('://') || path.includes('..')) return false;
  if (ALLOWED_REDIRECT_PATHS.includes(path)) return true;
  // Allow paths under /profile/*, /checkout/*, /home/*
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
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    } catch (e) {
      console.error('OAuth callback error:', e);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

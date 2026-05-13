import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createStubClient } from './stub';

/**
 * Session refresh middleware — handles Supabase cookie refresh.
 *
 * This function ONLY manages session lifecycle (cookie refresh).
 * Auth decisions (protected routes, role gating) are handled by
 * lib/auth/gateway.ts, which is imported by root middleware.ts.
 *
 * In development, missing env vars return `{ user: null }` and
 * a pass-through response — the middleware still runs but never
 * considers a user authenticated.
 */
export async function refreshSession(request: NextRequest): Promise<{
  user: { id: string } | null;
  response: NextResponse;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      return { user: null, response: NextResponse.next({ request }) };
    }
    throw new Error(
      'Missing Supabase client credentials. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  // Track cookie options so we can transfer them to the response
  const cookieOptions = new Map<string, Record<string, unknown>>();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Store options for later transfer to response
          cookieOptions.set(name, options);
          request.cookies.set(name, value);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Build response after all cookie sets are done — single response, all cookies accumulated
  const response = NextResponse.next({ request });
  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    // Preserve original cookie options (path, secure, sameSite, httpOnly, maxAge, etc.)
    const opts = cookieOptions.get(cookie.name);
    if (opts) {
      response.cookies.set(cookie.name, cookie.value, opts);
    } else {
      response.cookies.set(cookie.name, cookie.value);
    }
  }

  return { user, response };
}

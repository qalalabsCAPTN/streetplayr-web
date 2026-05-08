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
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      return { user: null, response };
    }
    throw new Error(
      'Missing Supabase client credentials. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  return { user, response };
}

/**
 * Dev-mode Supabase stub — no-op placeholder returned when env vars are missing.
 *
 * Returns empty/null for all operations so the app can boot in development
 * without a configured Supabase project. Logs one warning on first use.
 *
 * Production always throws when env vars are missing (see the individual
 * factory functions in admin.ts, server.ts, client.ts, middleware.ts).
 */

let warned = false;

function warnOnce(label: string) {
  if (warned) return;
  warned = true;
  console.warn(
    `[Supabase Stub:${label}] Supabase env vars not configured — ` +
    'returning empty data for all operations. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ' +
    'and SUPABASE_SERVICE_ROLE_KEY in .env for real data.'
  );
}

function stubResult(data: unknown = null) {
  return Promise.resolve({ data, error: null, count: null });
}

/**
 * Creates a callable/thenable proxy node for sub-properties of the stub client.
 */
function createSubNode(promiseResult: Promise<any>): any {
  return new Proxy(() => {}, {
    apply() {
      return createSubNode(promiseResult);
    },
    get(_, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        const val = Reflect.get(promiseResult, prop);
        return typeof val === 'function' ? val.bind(promiseResult) : val;
      }
      return createSubNode(promiseResult);
    },
  });
}

/**
 * Creates a stub Supabase client suitable for development use only.
 *
 * The stub supports all of the standard Supabase JS client patterns
 * (from/select/insert/update/delete/eq/order/single/rpc/auth/channel/on/subscribe)
 * but always returns null/empty data and never makes network requests.
 */
export function createStubSupabase(label = 'default'): any {
  warnOnce(label);

  const result = stubResult(null);

  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // Return undefined so the top-level client is not considered thenable/awaitable
        return undefined;
      }
      return createSubNode(result);
    },
  });
}

/**
 * Creates a stub Supabase client whose `auth` namespace methods return
 * `{ data: { session: null, user: null }, error: null }` instead of `{ data: null, ... }`.
 *
 * This is the variant returned by the `server.ts` and `client.ts` factories
 * so that middleware, SSR utilities, and server-action auth checks can
 * safely destructure `const { data: { user } } = await supabase.auth.getUser()`.
 */
export function createStubClient(label = 'default'): any {
  warnOnce(label);

  const clientResult = stubResult(null);
  const authResult = stubResult({ session: null, user: null });

  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // Return undefined so the top-level client is not considered thenable/awaitable
        return undefined;
      }
      if (prop === 'auth') {
        return createSubNode(authResult);
      }
      return createSubNode(clientResult);
    },
  });
}

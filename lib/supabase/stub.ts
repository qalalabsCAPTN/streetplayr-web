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

function createNode(options?: { data: unknown }): any {
  const resultData = options?.data ?? null;
  const result = stubResult(resultData);

  return new Proxy(() => {}, {
    apply() {
      return createNode(options);
    },
    get(_, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Reflect.get(result, prop);
      }
      return createNode(options);
    },
  });
}

/**
 * Creates a stub Supabase client suitable for development use only.
 *
 * The stub supports all of the standard Supabase JS client patterns
 * (from/select/insert/update/delete/eq/order/single/rpc/auth/channel/on/subscribe)
 * but always returns null/empty data and never makes network requests.
 *
 * The `auth.getUser()` and `auth.getSession()` methods return
 * `{ data: { user: null }, error: null }` rather than `{ data: null, ... }`
 * so that callers can safely destructure `{ data: { user } }`.
 */
export function createStubSupabase(label = 'default'): any {
  warnOnce(label);

  return createNode();
}

/**
 * Creates a stub Supabase client whose `auth` namespace methods return
 * `{ data: { user: null }, error: null }` instead of `{ data: null, ... }`.
 *
 * This is the variant returned by the `server.ts` and `client.ts` factories
 * so that middleware, SSR utilities, and server-action auth checks can
 * safely destructure `const { data: { user } } = await supabase.auth.getUser()`.
 */
export function createStubClient(label = 'default'): any {
  warnOnce(label);

  const authResult = stubResult({ user: null });

  function createAuthNode(): any {
    return new Proxy(() => {}, {
      apply() {
        return createAuthNode();
      },
      get(_, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return Reflect.get(authResult, prop);
        }
        return createAuthNode();
      },
    });
  }

  function createNode(): any {
    const result = stubResult(null);

    return new Proxy(() => {}, {
      apply() {
        return createNode();
      },
      get(_, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return Reflect.get(result, prop);
        }
        if (prop === 'auth') {
          return createAuthNode();
        }
        return createNode();
      },
    });
  }

  return createNode();
}

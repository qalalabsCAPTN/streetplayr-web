/**
 * Static (cookie-free) Supabase client for PUBLIC data queries.
 *
 * Unlike lib/supabase/server.ts, this client does NOT call `cookies()`,
 * which means Server Components that use it CAN be statically rendered / ISR-cached.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function createStaticClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("mockproject")) {
    throw new Error(
      "[createStaticClient] Missing Supabase env vars — callers must check before calling"
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "streetplayr-static" } },
  });

  return _client;
}

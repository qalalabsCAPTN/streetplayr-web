import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createStubSupabase } from './stub';

/**
 * Admin Supabase client — uses SERVICE_ROLE_KEY for privileged operations.
 *
 * WARNING: Only use in server-side contexts (server actions, API routes,
 * middleware). NEVER expose to the client bundle.
 *
 * In development, missing env vars produce a stub that returns empty data.
 * In production, missing env vars throw and block startup.
 */
export function createAdminClient(): SupabaseClient<any, any, any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || process.env.NEXT_PHASE === 'phase-action-build') {
    return createStubSupabase('admin');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

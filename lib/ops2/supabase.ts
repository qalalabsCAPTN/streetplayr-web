/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient<any> | null = null;

export function getSupabaseClient(): SupabaseClient<any> {
  if (_client) return _client;

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  _client = createClient<any>(url, key, {
    realtime: { params: { eventsPerSecond: 20 } },
  });

  return _client;
}

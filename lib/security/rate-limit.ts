/**
 * Production rate limit. Prefers shared Postgres RPC `consume_rate_limit`.
 * Falls back to in-memory only if the RPC is missing (local/dev).
 */

import { createAdminClient } from '@/lib/supabase/admin';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(params.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return { ok: true, remaining: params.limit - 1, retryAfterMs: params.windowMs };
  }
  if (existing.count >= params.limit) {
    return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: params.limit - existing.count,
    retryAfterMs: existing.resetAt - now,
  };
}

export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: boolean; remaining: number; retryAfterMs: number }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_key: params.key,
      p_limit: params.limit,
      p_window_seconds: Math.max(1, Math.ceil(params.windowMs / 1000)),
    });
    if (!error && typeof data === 'boolean') {
      return {
        ok: data,
        remaining: data ? params.limit - 1 : 0,
        retryAfterMs: params.windowMs,
      };
    }
  } catch {
    // fall through
  }
  return memoryLimit(params);
}

export function clientKey(headers: Headers, extra = ''): string {
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const real = headers.get('x-real-ip')?.trim();
  return `${fwd || real || 'anon'}:${extra}`;
}

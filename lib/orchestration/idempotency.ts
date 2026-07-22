/**
 * Idempotency + Retry Strategy
 *
 * Prevents duplicate processing of webhook events, server actions,
 * and payment confirmations. Uses a lightweight key-value store in
 * Supabase with TTL-based expiration.
 */
import { createAdminClient } from '@/lib/supabase/admin';

interface IdempotencyRecord {
  key: string;
  status: 'processing' | 'completed' | 'failed';
  data: any;
  created_at: string;
  expires_at: string;
}

const IDEMPOTENCY_TABLE = 'idempotency_keys';

/**
 * Creates or checks an idempotency guard for a given key.
 *
 * Usage:
 *   const guard = await idempotencyGuard(`stripe_event:evt_123`, { ttl: 86400 });
 *   if (!guard.canProceed) return { success: true, data: guard.existingData };
 *   // ... process event ...
 *   await guard.complete(resultData);
 */
export async function idempotencyGuard(
  key: string,
  options: { ttl?: number } = {}
): Promise<{
  canProceed: boolean;
  existingData: unknown;
  complete: (data?: unknown) => Promise<void>;
  fail: (error?: string) => Promise<void>;
}> {
  const ttl = options.ttl ?? 3600; // default 1 hour
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // Dev mode with no env vars or transient failure — allow processing
    // but no-op the complete/fail callbacks
    return {
      canProceed: true,
      existingData: null,
      complete: async () => {},
      fail: async () => {},
    };
  }

  // Try to insert a new idempotency key
  const { data: existing, error: insertError } = await admin
    .from(IDEMPOTENCY_TABLE)
    .upsert(
      {
        key,
        status: 'processing',
        data: null,
        expires_at: expiresAt,
      },
      {
        onConflict: 'key',
        ignoreDuplicates: true,
      }
    )
    .select('*')
    .single();

  // If insert conflicted or returned no rows due to duplicate ignore, this key was already seen
  if (insertError?.message?.includes('duplicate') || !existing || existing.status !== 'processing') {
    // Fetch the existing record
    const { data: record } = await admin
      .from(IDEMPOTENCY_TABLE)
      .select('*')
      .eq('key', key)
      .single();

    if (record) {
      return {
        canProceed: record.status === 'processing' && !isExpired(record.expires_at),
        existingData: record.data,
        complete: async (data) => {
          await admin
            .from(IDEMPOTENCY_TABLE)
            .update({ status: 'completed', data: data ?? null })
            .eq('key', key);
        },
        fail: async (error) => {
          await admin
            .from(IDEMPOTENCY_TABLE)
            .update({ status: 'failed', data: { error } })
            .eq('key', key);
        },
      };
    }
  }

  // Fresh key — allow processing
  return {
    canProceed: true,
    existingData: null,
    complete: async (data) => {
      await admin
        .from(IDEMPOTENCY_TABLE)
        .update({ status: 'completed', data: data ?? null })
        .eq('key', key);
    },
    fail: async (error) => {
      await admin
        .from(IDEMPOTENCY_TABLE)
        .update({ status: 'failed', data: { error } })
        .eq('key', key);
    },
  };
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Clean up expired idempotency keys.
 * Called by cron.
 */
export async function cleanupExpiredKeys(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { error, count } = await admin
      .from(IDEMPOTENCY_TABLE)
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('[Idempotency] Cleanup error:', error);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

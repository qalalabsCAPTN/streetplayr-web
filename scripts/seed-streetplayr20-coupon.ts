/**
 * Upsert checkout coupon STREETPLAYR20 (20% off).
 * Shoppers can type STREETplayR20 — codes are matched case-insensitively.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'missing supabase env' }));
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const payload = {
    code: 'STREETPLAYR20',
    kind: 'percent' as const,
    value: 20,
    min_subtotal: 0,
    max_redemptions: null,
    max_per_user: 1,
    starts_at: null,
    ends_at: null,
    is_active: true,
  };

  const existing = await admin.from('coupons').select('id').eq('code', payload.code).maybeSingle();
  const result = existing.data
    ? await admin.from('coupons').update(payload).eq('code', payload.code).select('id,code,kind,value,is_active,max_per_user,min_subtotal').single()
    : await admin.from('coupons').insert(payload).select('id,code,kind,value,is_active,max_per_user,min_subtotal').single();

  console.log(
    JSON.stringify({
      ok: !result.error,
      action: existing.data ? 'updated' : 'inserted',
      coupon: result.data ?? null,
      error: result.error?.message ?? null,
    })
  );
  if (result.error) process.exit(1);
}

main();

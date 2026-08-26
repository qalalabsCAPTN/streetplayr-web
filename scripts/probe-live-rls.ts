/**
 * Live RLS / RPC / table probe. Read-only except dummy reserve_inventory UUID.
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const publicClient = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });

  const tables = [
    'orders',
    'order_items',
    'inventory',
    'inventory_reservations',
    'coupons',
    'coupon_redemptions',
    'loyalty_quests',
    'loyalty_quest_progress',
    'wallet_transactions',
    'rate_limit_buckets',
    'profiles',
  ];

  for (const table of tables) {
    const anonRead = await publicClient.from(table).select('*').limit(1);
    const adminRead = await admin.from(table).select('*').limit(1);
    console.log(JSON.stringify({
      table,
      anon: anonRead.error ? anonRead.error.message : `ok rows=${anonRead.data?.length ?? 0}`,
      admin: adminRead.error ? adminRead.error.message : `ok rows=${adminRead.data?.length ?? 0}`,
    }));
  }

  const rpcs = [
    ['reserve_inventory', {
      p_variant_id: '00000000-0000-0000-0000-000000000000',
      p_product_id: '00000000-0000-0000-0000-000000000000',
      p_quantity: 1,
      p_owner: '00000000-0000-0000-0000-000000000000',
    }],
    ['consume_rate_limit', { p_key: 'probe:rls', p_limit: 5, p_window_seconds: 60 }],
  ] as const;

  for (const [name, args] of rpcs) {
    const r = await admin.rpc(name, args as never);
    console.log(JSON.stringify({
      rpc: name,
      error: r.error?.message ?? null,
      data: r.data ?? null,
    }));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

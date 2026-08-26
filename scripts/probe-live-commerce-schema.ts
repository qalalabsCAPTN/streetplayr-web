/**
 * Live-schema probe. Prints columns for commerce tables. No writes.
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

async function cols(admin: ReturnType<typeof createClient>, table: string) {
  const r = await admin.from(table).select('*').limit(1);
  if (r.error) return { table, error: r.error.message, columns: [] as string[] };
  const row = r.data?.[0];
  return { table, error: null, columns: row ? Object.keys(row) : ['(empty — select * succeeded)'] };
}

async function main() {
  loadEnvLocal();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = [
    'orders',
    'order_items',
    'inventory',
    'inventory_reservations',
    'product_variants',
    'payment_events',
    'customers',
    'profiles',
    'wallet_transactions',
    'nectar_wallet_transactions',
    'user_addresses',
    'coupons',
    'bonus_campaigns',
    'reward_redemptions',
  ];

  for (const t of tables) {
    const info = await cols(admin, t);
    console.log(JSON.stringify(info));
  }

  const rpc = await admin.rpc('reserve_inventory', {
    p_variant_id: '00000000-0000-0000-0000-000000000000',
    p_product_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1,
    p_owner: '00000000-0000-0000-0000-000000000000',
  });
  console.log(JSON.stringify({ rpc: 'reserve_inventory', error: rpc.error?.message ?? null }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

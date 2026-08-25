import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
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
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const inv = await admin.from('inventory').select('*').limit(3);
  console.log('inventory sample', inv.error?.message || JSON.stringify(inv.data, null, 2));
  console.log('inventory cols', inv.data?.[0] ? Object.keys(inv.data[0]) : 'none');

  // Find INR priced variants near real catalog
  const inr = await admin
    .from('product_variants')
    .select('id, sku, title, price, currency, is_active, product_id, products!inner(title, slug, status)')
    .eq('currency', 'INR')
    .eq('is_active', true)
    .order('price', { ascending: true })
    .limit(10);
  console.log('INR variants', inr.error?.message || JSON.stringify(inr.data, null, 2));

  const anySku = await admin
    .from('product_variants')
    .select('id, sku, price, currency, is_active')
    .eq('sku', 'TEST-E2E-001')
    .maybeSingle();
  console.log('exact TEST-E2E-001', anySku.error?.message || anySku.data);

  // profiles roles distribution
  const roles = await admin.from('profiles').select('role');
  const counts: Record<string, number> = {};
  for (const r of roles.data || []) counts[String(r.role)] = (counts[String(r.role)] || 0) + 1;
  console.log('profile roles', roles.error?.message || counts);

  // organization id used by products
  const org = await admin.from('products').select('organization_id').limit(1).maybeSingle();
  console.log('org sample', org.data);

  // collections sample for association
  const cols = await admin.from('collections').select('id, name, slug, status').limit(10);
  console.log('collections', cols.error?.message || JSON.stringify(cols.data, null, 2));
}

main().catch(console.error);

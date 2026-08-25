import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i);
  let v = t.slice(i + 1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data, error } = await admin
    .from('product_variants')
    .select('id, sku, title, price, currency, is_active, product:products!inner(title, slug, status)')
    .eq('product.slug', 'PS-TEE-WAR-BLK');
  console.log('WAR-BLK', error?.message || data);

  const { data: ps } = await admin
    .from('product_variants')
    .select('id, sku, price, currency, is_active')
    .ilike('sku', 'PS-%')
    .order('price', { ascending: true })
    .limit(12);
  console.log('PS skus cheapest', ps);

  const { data: operators } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'operator');
  console.log(
    'operators (emails redacted lens)',
    operators?.map((o) => ({ id: o.id, role: o.role, emailLen: o.email?.length }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

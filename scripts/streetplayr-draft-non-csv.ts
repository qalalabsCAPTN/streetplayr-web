/**
 * Draft active streetplayr products whose slug is not a CSV parent.
 * Does not delete. Does not touch CSV SKUs / variants / inventory.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const CSV_PARENTS = new Set([
  'PS-PNT-CARP-GRN',
  'PS-PNT-CARP-GRY',
  'PS-PNT-CORE-BLK',
  'PS-PNT-CORE-CRM',
  'PS-TNK-STR-BLK',
  'PS-TNK-STR-WHT',
  'PS-TEE-CRT-RED',
  'PS-TEE-CRT-WHT',
  'PS-TEE-INS-PRP',
  'PS-TEE-WAR-BLK',
  'PS-TEE-WAR-BRW',
]);

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
  const { data: brand } = await admin.from('brands').select('id').eq('slug', brandSlug).maybeSingle();
  if (!brand?.id) throw new Error('brand missing');

  const { data: inspired } = await admin
    .from('product_variants')
    .select('sku, price')
    .eq('product_id', '4061f0ed-377e-4d77-85a0-9013772a919b')
    .order('sku');

  const { data: active } = await admin
    .from('products')
    .select('id, slug, title, status')
    .eq('brand_id', brand.id)
    .eq('status', 'active');

  const extras = (active ?? []).filter((p) => !CSV_PARENTS.has(p.slug));
  if (extras.length) {
    const { error } = await admin
      .from('products')
      .update({ status: 'draft' })
      .in(
        'id',
        extras.map((p) => p.id)
      );
    if (error) throw error;
  }

  const { data: stillActive } = await admin
    .from('products')
    .select('slug, title, status')
    .eq('brand_id', brand.id)
    .eq('status', 'active')
    .order('slug');

  console.log(
    JSON.stringify(
      {
        inspiredPrices: inspired,
        drafted: extras.map((p) => p.slug),
        activeAfter: (stillActive ?? []).map((p) => p.slug),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

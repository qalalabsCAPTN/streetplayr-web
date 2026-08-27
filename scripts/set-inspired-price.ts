/**
 * Temporary ₹5 Inspired price. Restore after payment test:
 *   npx tsx scripts/set-inspired-price.ts 2299
 * Live original was ₹2299 on product_variants (not the local 2499 fallback).
 * Usage: npx tsx scripts/set-inspired-price.ts 5
 *        npx tsx scripts/set-inspired-price.ts 2499
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
  const nextPrice = Number(process.argv[2]);
  if (!Number.isFinite(nextPrice) || nextPrice < 1) {
    console.error('Usage: npx tsx scripts/set-inspired-price.ts <price>');
    process.exit(1);
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const productId = '4061f0ed-377e-4d77-85a0-9013772a919b';
  const { data: product, error: pErr } = await admin
    .from('products')
    .select('id, title, slug, status')
    .eq('id', productId)
    .single();
  if (pErr || !product) {
    console.error('Inspired product not found', pErr?.message);
    process.exit(1);
  }

  const { data: before, error: bErr } = await admin
    .from('product_variants')
    .select('id, sku, price')
    .eq('product_id', productId);
  if (bErr || !before?.length) {
    console.error('Inspired variants not found', bErr?.message);
    process.exit(1);
  }

  const { error: uErr } = await admin
    .from('product_variants')
    .update({ price: nextPrice })
    .eq('product_id', productId);
  if (uErr) {
    console.error('Update failed', uErr.message);
    process.exit(1);
  }

  const { data: after } = await admin
    .from('product_variants')
    .select('id, sku, price')
    .eq('product_id', productId)
    .order('sku');

  console.log(JSON.stringify({
    product: { id: product.id, title: product.title, slug: product.slug, status: product.status },
    before: before.map((v) => ({ sku: v.sku, price: v.price })),
    after: (after ?? []).map((v) => ({ sku: v.sku, price: v.price })),
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

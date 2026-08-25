/**
 * Schema-correct product/inventory probe + ops create-path check.
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
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('=== FIND E2E / CHEAP PRODUCTS ===');
  const byTitle = await admin
    .from('products')
    .select('id, title, slug, status, brand_id, category_id, is_featured')
    .or('title.ilike.%E2E%,title.ilike.%TEST-E2E%,slug.ilike.%e2e%,slug.ilike.%test-e2e%')
    .limit(20);
  console.log('byTitle', byTitle.error?.message || JSON.stringify(byTitle.data, null, 2));

  const bySku = await admin
    .from('product_variants')
    .select('id, sku, title, price, is_active, product_id, attributes')
    .or('sku.ilike.%TEST-E2E%,sku.ilike.%E2E%,sku.eq.TEST-E2E-001')
    .limit(20);
  console.log('bySku', bySku.error?.message || JSON.stringify(bySku.data, null, 2));

  const cheapVar = await admin
    .from('product_variants')
    .select('id, sku, title, price, is_active, product_id, attributes')
    .lte('price', 10)
    .order('price', { ascending: true })
    .limit(15);
  console.log('cheap variants', cheapVar.error?.message || JSON.stringify(cheapVar.data, null, 2));

  console.log('\n=== INVENTORY TABLES ===');
  for (const table of [
    'inventory',
    'inventory_levels',
    'inventory_items',
    'stock_levels',
    'variant_inventory',
    'inventory_reservations',
    'warehouses',
  ]) {
    const r = await admin.from(table).select('*', { count: 'exact', head: true });
    console.log(table, r.error ? `NO ${r.error.message}` : `OK count=${r.count}`);
  }

  console.log('\n=== SAMPLE LIVE PRODUCTS + VARIANTS ===');
  const products = await admin
    .from('products')
    .select('id, title, slug, status, brand_id, category_id')
    .eq('status', 'active')
    .limit(5);
  console.log('active products', products.error?.message || JSON.stringify(products.data, null, 2));

  if (products.data?.[0]) {
    const pid = products.data[0].id;
    const vars = await admin
      .from('product_variants')
      .select('*')
      .eq('product_id', pid)
      .limit(5);
    console.log('variants for', products.data[0].slug, vars.error?.message || JSON.stringify(vars.data, null, 2));
  }

  console.log('\n=== REWARD RULES COLUMNS ===');
  const rule = await admin.from('reward_rules').select('*').limit(5);
  console.log(rule.error?.message || JSON.stringify(rule.data, null, 2));

  console.log('\n=== RECENT EVENTS / EXECUTIONS ===');
  const events = await admin
    .from('events')
    .select('id, event_type, platform, actor_user_id, status, created_at, error_message')
    .order('created_at', { ascending: false })
    .limit(8);
  console.log('events', events.error?.message || JSON.stringify(events.data, null, 2));

  const execs = await admin
    .from('reward_executions')
    .select('id, rule_id, user_id, event_id, status, points_granted, xp_granted, created_at, failure_reason')
    .order('created_at', { ascending: false })
    .limit(8);
  console.log('executions', execs.error?.message || JSON.stringify(execs.data, null, 2));

  console.log('\n=== COLLECTION MEMBERSHIP TABLES ===');
  for (const table of ['collections', 'collection_products', 'product_collections']) {
    const r = await admin.from(table).select('*', { count: 'exact', head: true });
    console.log(table, r.error ? `NO ${r.error.message}` : `OK count=${r.count}`);
  }

  console.log('\n=== PRODUCT CREATE PATH COMPAT ===');
  // Mirror createProductAction columns against live schema
  const neededProductCols = ['name', 'slug', 'price', 'description', 'is_active', 'category_id'];
  const liveProductCols = [
    'id', 'organization_id', 'brand_id', 'title', 'slug', 'description', 'status',
    'featured_image_url', 'media_assets', 'category_id', 'tags', 'metadata',
    'created_at', 'updated_at', 'published_at', 'scheduled_at', 'is_featured',
  ];
  for (const c of neededProductCols) {
    console.log(`createProductAction needs '${c}':`, liveProductCols.includes(c) ? 'OK' : 'MISSING');
  }
  const neededVariantCols = ['product_id', 'color', 'size', 'stock_quantity', 'price_override'];
  const liveVariantCols = [
    'id', 'product_id', 'sku', 'title', 'price', 'compare_at_price', 'cost_price',
    'currency', 'weight', 'weight_unit', 'dimensions', 'is_active', 'sort_order',
    'attributes', 'created_at', 'updated_at',
  ];
  for (const c of neededVariantCols) {
    console.log(`upsertVariantAction needs '${c}':`, liveVariantCols.includes(c) ? 'OK' : 'MISSING');
  }

  console.log('\n=== OPS ROLE USERS (count only) ===');
  const ops = await admin
    .from('profiles')
    .select('id, email, role', { count: 'exact' })
    .in('role', ['super_admin', 'ops_admin', 'admin', 'ops']);
  console.log('ops profiles', ops.error?.message || `count=${ops.count} sample=${JSON.stringify(ops.data?.slice(0, 3))}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

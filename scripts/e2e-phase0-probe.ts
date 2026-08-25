/**
 * Phase 0 E2E probe — read-only. Never prints secret values.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function hostOf(url?: string | null): string {
  if (!url) return '(unset)';
  try {
    return new URL(url).host;
  } catch {
    return '(invalid-url)';
  }
}

function setLen(name: string): string {
  const v = process.env[name];
  if (v == null) return 'UNSET';
  if (!v.trim()) return 'EMPTY';
  return `SET len=${v.trim().length}`;
}

async function timedFetch(url: string, init?: RequestInit, ms = 8000) {
  const started = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
    const text = await res.text().catch(() => '');
    return {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      snippet: text.slice(0, 180).replace(/\s+/g, ' '),
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      snippet: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  loadEnvLocal();

  console.log('=== CONFIG (non-secret) ===');
  console.log('SITE_URL', process.env.NEXT_PUBLIC_SITE_URL || '(unset)');
  console.log('SUPABASE_HOST', hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL));
  console.log('SUPABASE_ANON', setLen('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
  console.log('SUPABASE_SERVICE', setLen('SUPABASE_SERVICE_ROLE_KEY'));
  console.log('NECTAR_API_URL', process.env.NECTAR_API_URL || '(unset)');
  console.log('NEXT_PUBLIC_NECTAR_API_URL', process.env.NEXT_PUBLIC_NECTAR_API_URL || '(unset)');
  console.log('NECTAR_HOST', hostOf(process.env.NECTAR_API_URL ?? process.env.NEXT_PUBLIC_NECTAR_API_URL));
  console.log('NECTAR_SIGNING_SECRET', setLen('NECTAR_SIGNING_SECRET'));
  console.log('PLATFORM_TOKEN_STREETPLAYR', setLen('PLATFORM_TOKEN_STREETPLAYR'));
  console.log('EASEBUZZ_ENV', process.env.EASEBUZZ_ENV || '(unset)');
  console.log('EASEBUZZ_KEY', setLen('EASEBUZZ_MERCHANT_KEY'));
  console.log('EASEBUZZ_SALT', setLen('EASEBUZZ_SALT'));
  console.log('UNICOMMERCE_API_URL', process.env.UNICOMMERCE_API_URL || '(unset)');
  console.log('UNICOMMERCE_HOST', hostOf(process.env.UNICOMMERCE_API_URL));
  console.log('UNICOMMERCE_USERNAME', setLen('UNICOMMERCE_USERNAME'));
  console.log('UNICOMMERCE_PASSWORD', setLen('UNICOMMERCE_PASSWORD'));
  console.log('UNICOMMERCE_FACILITY_CODE', process.env.UNICOMMERCE_FACILITY_CODE || '(unset)');
  console.log('DEMO_INVENTORY_MODE', process.env.DEMO_INVENTORY_MODE || '(unset)');
  console.log('USE_LOCAL_CATALOG', process.env.USE_LOCAL_CATALOG || '(unset)');
  console.log('NODE_ENV', process.env.NODE_ENV || '(unset)');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('BLOCKED: supabase credentials missing');
    process.exitCode = 1;
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n=== SUPABASE REACHABILITY ===');
  const ping = await admin.from('products').select('id', { count: 'exact', head: true });
  if (ping.error) {
    console.log('products ping FAIL', ping.error.message, ping.error.code);
  } else {
    console.log('products ping OK count=', ping.count);
  }

  console.log('\n=== TEST PRODUCT SEARCH ===');
  const skuSearch = await admin
    .from('product_variants')
    .select('id, sku, title, price, stock_quantity, product_id, products(id, name, slug, price, is_active, status)')
    .or('sku.ilike.%TEST-E2E%,sku.ilike.%E2E%,title.ilike.%E2E Test%')
    .limit(20);
  console.log('variant sku search error=', skuSearch.error?.message || 'none');
  console.log('variant sku rows=', JSON.stringify(skuSearch.data, null, 2));

  const nameSearch = await admin
    .from('products')
    .select('id, name, slug, price, is_active, status, sku')
    .or('name.ilike.%E2E Test%,name.ilike.%TEST-E2E%,slug.ilike.%e2e%')
    .limit(20);
  console.log('product name search error=', nameSearch.error?.message || 'none');
  console.log('product name rows=', JSON.stringify(nameSearch.data, null, 2));

  const cheap = await admin
    .from('products')
    .select('id, name, slug, price, is_active, status')
    .lte('price', 10)
    .order('price', { ascending: true })
    .limit(10);
  console.log('cheap products error=', cheap.error?.message || 'none');
  console.log('cheap products=', JSON.stringify(cheap.data, null, 2));

  const sampleVariants = await admin
    .from('product_variants')
    .select('id, sku, title, price, stock_quantity, product_id')
    .not('sku', 'is', null)
    .limit(8);
  console.log('sample variants error=', sampleVariants.error?.message || 'none');
  console.log('sample variants=', JSON.stringify(sampleVariants.data, null, 2));

  console.log('\n=== SCHEMA PROBE (products/variants columns) ===');
  const oneProd = await admin.from('products').select('*').limit(1).maybeSingle();
  console.log('products columns=', oneProd.data ? Object.keys(oneProd.data) : oneProd.error?.message);
  const oneVar = await admin.from('product_variants').select('*').limit(1).maybeSingle();
  console.log('variants columns=', oneVar.data ? Object.keys(oneVar.data) : oneVar.error?.message);

  console.log('\n=== NECTAR TABLES ===');
  for (const table of [
    'events',
    'reward_executions',
    'nectar_wallet_transactions',
    'reward_rules',
    'wallet_balances',
  ]) {
    const r = await admin.from(table).select('id', { count: 'exact', head: true });
    console.log(
      table,
      r.error ? `FAIL ${r.error.message}` : `OK count=${r.count}`
    );
  }

  const purchaseRules = await admin
    .from('reward_rules')
    .select('id, name, event_type, status, points, xp, is_active')
    .or('event_type.eq.purchase.completed,trigger.eq.purchase.completed,name.ilike.%purchase%')
    .limit(20);
  console.log('purchase reward rules error=', purchaseRules.error?.message || 'none');
  console.log('purchase reward rules=', JSON.stringify(purchaseRules.data, null, 2));

  console.log('\n=== HTTP PROBES ===');
  const nectarBase = (
    process.env.NECTAR_API_URL ??
    process.env.NEXT_PUBLIC_NECTAR_API_URL ??
    ''
  ).replace(/\/$/, '');
  if (nectarBase) {
    const healthUrls = [
      `${nectarBase}/health`,
      `${nectarBase}/v1/health`,
      `${nectarBase}/`,
    ];
    for (const u of healthUrls) {
      const r = await timedFetch(u);
      console.log('NECTAR', u, r.status, r.ms + 'ms', r.snippet);
    }
  } else {
    console.log('NECTAR URL unset');
  }

  const easeEnv = process.env.EASEBUZZ_ENV === 'prod' ? 'prod' : 'test';
  const easeHost =
    easeEnv === 'prod' ? 'https://pay.easebuzz.in' : 'https://testpay.easebuzz.in';
  const ease = await timedFetch(easeHost);
  console.log('EASEBUZZ', easeHost, 'env=' + easeEnv, ease.status, ease.ms + 'ms', ease.snippet.slice(0, 80));

  const ucUrl = (process.env.UNICOMMERCE_API_URL || '').replace(/\/$/, '');
  if (ucUrl) {
    const uc = await timedFetch(ucUrl);
    console.log('UNICOMMERCE root', ucUrl, uc.status, uc.ms + 'ms', uc.snippet.slice(0, 80));
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  for (const port of [3000, 3001, 3002]) {
    const r = await timedFetch(`http://127.0.0.1:${port}/home`, undefined, 3000);
    console.log('LOCAL', `http://127.0.0.1:${port}/home`, r.status, r.ms + 'ms', r.snippet.slice(0, 80));
  }
  const siteR = await timedFetch(`${site.replace(/\/$/, '')}/home`, undefined, 8000);
  console.log('SITE_URL /home', site, siteR.status, siteR.ms + 'ms', siteR.snippet.slice(0, 80));

  console.log('\n=== CATEGORIES / BRANDS ===');
  const cats = await admin.from('categories').select('id, name, slug').limit(10);
  console.log('categories error=', cats.error?.message || 'none');
  console.log('categories=', JSON.stringify(cats.data, null, 2));
  const brands = await admin.from('brands').select('id, name, slug').limit(10);
  console.log('brands error=', brands.error?.message || 'none');
  console.log('brands=', JSON.stringify(brands.data, null, 2));
}

main().catch((e) => {
  console.error('PROBE CRASH', e);
  process.exitCode = 1;
});

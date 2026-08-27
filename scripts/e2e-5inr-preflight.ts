/**
 * Controlled ₹5 E2E preflight. Never prints secrets.
 * Usage: npx tsx scripts/e2e-5inr-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
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

function present(v: string | undefined) {
  return Boolean(v?.trim());
}

function hostOnly(url: string | undefined) {
  if (!url) return 'MISSING';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'INVALID_URL';
  }
}

async function main() {
  loadEnvLocal();
  const report: Record<string, string> = {};

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const easeEnv = process.env.EASEBUZZ_ENV ?? '';
  const easeKey = process.env.EASEBUZZ_MERCHANT_KEY;
  const easeSalt = process.env.EASEBUZZ_SALT;
  const ucUrl = process.env.UNICOMMERCE_API_URL;
  const ucUser = process.env.UNICOMMERCE_USERNAME;
  const ucPass = process.env.UNICOMMERCE_PASSWORD;
  const ucChannel = process.env.UNICOMMERCE_CHANNEL_CODE;
  const ucFacility = process.env.UNICOMMERCE_FACILITY_CODE;
  const nectarUrl = process.env.NECTAR_API_URL;
  const nectarSecret = process.env.NECTAR_SIGNING_SECRET || process.env.PLATFORM_TOKEN_STREETPLAYR;
  const smtp =
    present(process.env.SMTP_HOST) &&
    present(process.env.SMTP_USER) &&
    present(process.env.SMTP_PASSWORD) &&
    present(process.env.TRANSACTIONAL_FROM_EMAIL);
  const demoInv = process.env.DEMO_INVENTORY_MODE;
  const localCat = process.env.USE_LOCAL_CATALOG;

  console.log('=== PREFLIGHT (no secrets) ===');
  console.log(`SITE_HOST=${hostOnly(site)}`);
  console.log(`SUPABASE_HOST=${hostOnly(supabaseUrl)}`);
  console.log(`EASEBUZZ_ENV=${easeEnv || 'MISSING'}`);
  console.log(`EASEBUZZ_HOST=${easeEnv === 'prod' ? 'pay.easebuzz.in' : easeEnv === 'test' ? 'testpay.easebuzz.in' : 'UNKNOWN'}`);
  console.log(`UC_HOST=${hostOnly(ucUrl)}`);
  console.log(`UC_CHANNEL=${ucChannel || 'MISSING'}`);
  console.log(`UC_FACILITY_SET=${present(ucFacility)}`);
  console.log(`NECTAR_HOST=${hostOnly(nectarUrl)}`);
  console.log(`DEMO_INVENTORY_MODE=${demoInv ?? 'unset'}`);
  console.log(`USE_LOCAL_CATALOG=${localCat ?? 'unset'}`);
  console.log(`CALLBACK=${site.replace(/\/$/, '')}/api/webhooks/easebuzz`);

  if (easeEnv === 'prod') {
    console.warn('Easebuzz TEST FAIL: EASEBUZZ_ENV=prod. Will not initiate live charge.');
  }

  report.EasebuzzConfig =
    easeEnv === 'test' && present(easeKey) && present(easeSalt) ? 'PASS' : 'FAIL';
  report.EasebuzzNotLive = easeEnv !== 'prod' ? 'PASS' : 'FAIL';
  report.WebhookPublicHttps =
    site.startsWith('https://') && !/localhost|127\.0\.0\.1/i.test(site) ? 'PASS' : 'FAIL';

  if (!present(supabaseUrl) || !present(serviceKey) || !present(anon)) {
    report.Supabase = 'FAIL';
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const admin = createClient(supabaseUrl!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: pingErr } = await admin.from('products').select('id').limit(1);
  report.Supabase = pingErr ? `FAIL:${pingErr.message}` : 'PASS';

  const { data: brand } = await admin
    .from('brands')
    .select('id, slug')
    .eq('slug', process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr')
    .maybeSingle();
  report.Brand = brand?.id ? 'PASS' : 'FAIL';

  const { data: inspiredProducts, error: inspErr } = await admin
    .from('products')
    .select('id, title, slug, status, metadata')
    .or('title.ilike.%inspired%,slug.ilike.%INS-PRP%,slug.ilike.%inspired%');

  if (inspErr) {
    report.InspiredProduct = `FAIL:${inspErr.message}`;
  } else {
    console.log(
      'INSPIRED_HITS',
      (inspiredProducts ?? []).map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status }))
    );
  }

  const product =
    (inspiredProducts ?? []).find((p) => /inspired/i.test(`${p.title} ${p.slug}`)) ??
    inspiredProducts?.[0];

  if (!product) {
    report.InspiredProduct = 'FAIL:not_found';
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const { data: variants, error: varErr } = await admin
    .from('product_variants')
    .select('id, sku, title, price, attributes')
    .eq('product_id', product.id)
    .order('sku');

  if (varErr || !variants?.length) {
    report.InspiredVariants = `FAIL:${varErr?.message || 'none'}`;
  } else {
    report.InspiredProduct = 'PASS';
    report.InspiredVariants = 'PASS';
    const variantIds = variants.map((v) => v.id);
    const { data: invRows } = await admin
      .from('inventory')
      .select('variant_id, quantity')
      .in('variant_id', variantIds);
    const qty = new Map((invRows ?? []).map((r) => [r.variant_id, Number(r.quantity ?? 0)]));
    console.log(
      'INSPIRED_VARIANTS',
      variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        price: v.price,
        stock: qty.get(v.id) ?? 0,
        size: (v.attributes as { size?: string } | null)?.size,
      }))
    );
    const inStock = variants.filter((v) => (qty.get(v.id) ?? 0) > 0);
    report.InspiredStock = inStock.length > 0 ? 'PASS' : 'FAIL:zero_stock';
  }

  const { count: resCount, error: resErr } = await admin
    .from('inventory_reservations')
    .select('id', { count: 'exact', head: true })
    .limit(1);
  report.ReservationsTable = resErr ? `FAIL:${resErr.message}` : 'PASS';

  const { error: walletErr } = await admin.from('wallet_transactions').select('id').limit(1);
  report.WalletTable = walletErr ? `FAIL:${walletErr.message}` : 'PASS';

  const { error: eventsErr } = await admin.from('operational_events').select('id').limit(1);
  report.OrderEventsTable = eventsErr ? `FAIL:${eventsErr.message}` : 'PASS';

  report.UniCommerceCredentials =
    present(ucUrl) && present(ucUser) && present(ucPass) && present(ucFacility) ? 'PASS' : 'FAIL';
  report.UniCommerceChannel = present(ucChannel) ? `PASS:${ucChannel}` : 'FAIL:missing_uses_STREETPLAYR_WEB_fallback';
  report.NectarConfig = present(nectarUrl) && present(nectarSecret) ? 'PASS' : 'FAIL';
  report.NotificationsConfig = smtp ? 'PASS' : 'FAIL:smtp_incomplete';

  if (present(ucUrl) && present(ucUser) && present(ucPass)) {
    try {
      const ping = await fetch(ucUrl!.replace(/\/$/, ''), { method: 'GET', signal: AbortSignal.timeout(8000) });
      report.UniCommerceReachable = ping.ok || ping.status < 500 ? `PASS:http_${ping.status}` : `FAIL:http_${ping.status}`;
    } catch (e) {
      report.UniCommerceReachable = `FAIL:${e instanceof Error ? e.message : 'unreachable'}`;
    }
  }

  if (present(nectarUrl)) {
    try {
      const ping = await fetch(nectarUrl!.replace(/\/$/, '') + '/health', {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      report.NectarReachable = `INFO:http_${ping.status}`;
    } catch (e) {
      report.NectarReachable = `FAIL:${e instanceof Error ? e.message : 'unreachable'}`;
    }
  }

  if (easeEnv === 'test' && present(easeKey) && present(easeSalt)) {
    try {
      const ping = await fetch('https://testpay.easebuzz.in', {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      report.EasebuzzReachable = ping.status < 500 ? `PASS:http_${ping.status}` : `FAIL:http_${ping.status}`;
    } catch (e) {
      report.EasebuzzReachable = `FAIL:${e instanceof Error ? e.message : 'unreachable'}`;
    }
  }

  if (present(ucUrl) && present(ucUser) && present(ucPass) && present(ucFacility) && variants?.length) {
    try {
      const { getUnicommerceConfig } = await import('../src/integrations/unicommerce/config');
      const uc = getUnicommerceConfig();
      const probeSkus = Array.from(
        new Set([
          ...variants.map((v) => v.sku).filter(Boolean),
          'PS-TEE-INS-PRP-S',
          'PS-TEE-INS-PRP-M',
        ])
      ) as string[];
      const hits: Array<{ sku: string; ok: boolean; brand?: string; name?: string }> = [];
      for (const sku of probeSkus.slice(0, 8)) {
        const envelope = `<?xml version="1.0"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/"><soapenv:Header><wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><wsse:UsernameToken><wsse:Username>${uc.username}</wsse:Username><wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${uc.password}</wsse:Password></wsse:UsernameToken></wsse:Security></soapenv:Header><soapenv:Body><ser:GetItemTypeRequest><ser:SkuCode>${sku}</ser:SkuCode></ser:GetItemTypeRequest></soapenv:Body></soapenv:Envelope>`;
        const res = await fetch(`${uc.apiUrl}/services/soap/?version=1.9&facility=${uc.facilityCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: 'GetItemTypeRequest',
            Facility: uc.facilityCode,
          },
          body: envelope,
          signal: AbortSignal.timeout(20000),
        });
        const xml = await res.text();
        const skuHit = xml.match(/<([^>:]+:)?SkuCode[^>]*>([^<]+)</);
        const brandHit = xml.match(/<([^>:]+:)?Brand[^>]*>([^<]+)</);
        const nameHit = xml.match(/<([^>:]+:)?Name[^>]*>([^<]+)</);
        const successful = /<[^>]*Successful[^>]*>true<\/[^>]*Successful>/i.test(xml);
        hits.push({
          sku,
          ok: res.ok && successful && Boolean(skuHit?.[2]),
          brand: brandHit?.[2],
          name: nameHit?.[2],
        });
      }
      console.log('UC_SKU_PROBE', hits);
      report.UniCommerceInspiredSku = hits.some((h) => h.ok) ? 'PASS' : 'FAIL:no_matching_sku';
    } catch (e) {
      report.UniCommerceInspiredSku = `FAIL:${e instanceof Error ? e.message : 'soap_error'}`;
    }
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', '.e2e-5inr-state.json'),
    JSON.stringify(
      {
        productId: product.id,
        productTitle: product.title,
        slug: product.slug,
        variants: variants ?? [],
        originalPrices: (variants ?? []).map((v) => ({ id: v.id, sku: v.sku, price: v.price })),
      },
      null,
      2
    )
  );

  console.log('\n=== PREFLIGHT REPORT ===');
  for (const [k, v] of Object.entries(report)) console.log(`${k}: ${v}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

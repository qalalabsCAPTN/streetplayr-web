/**
 * LIVE smoke-test PREFLIGHT only.
 * Does NOT call Easebuzz initiateLink. Does NOT open checkout.
 * Never prints key/salt.
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

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label} | ${detail}`);
  return ok;
}

async function main() {
  loadEnvLocal();

  const envRaw = process.env.EASEBUZZ_ENV ?? '';
  const key = process.env.EASEBUZZ_MERCHANT_KEY;
  const salt = process.env.EASEBUZZ_SALT;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const resolvedEnv = envRaw === 'prod' ? 'prod' : 'test';
  const payHost =
    resolvedEnv === 'prod' ? 'https://pay.easebuzz.in' : 'https://testpay.easebuzz.in';
  const initiateEndpoint = `${payHost}/payment/initiateLink`;
  const callbackUrl = `${site.replace(/\/$/, '')}/api/webhooks/easebuzz`;

  console.log('=== LIVE SMOKE PREFLIGHT (NO PAYMENT SUBMITTED) ===\n');

  let allOk = true;
  allOk =
    check('EASEBUZZ_ENV=prod', envRaw === 'prod', `raw="${envRaw || 'MISSING'}" resolved=${resolvedEnv}`) &&
    allOk;
  allOk =
    check(
      'Production pay host',
      payHost === 'https://pay.easebuzz.in',
      `host=${payHost}`
    ) && allOk;
  allOk =
    check(
      'Credentials loaded (server-side)',
      !!(key?.trim() && salt?.trim()),
      `keyLen=${key?.trim().length ?? 0} saltLen=${salt?.trim().length ?? 0} keyWs=${key !== key?.trim()} saltWs=${salt !== salt?.trim()}`
    ) && allOk;
  allOk =
    check(
      'Callback is public HTTPS (not localhost)',
      site.startsWith('https://') && !/localhost|127\.0\.0\.1/i.test(site),
      `NEXT_PUBLIC_SITE_URL=${site || 'MISSING'}`
    ) && allOk;
  allOk =
    check(
      'Callback path',
      callbackUrl.endsWith('/api/webhooks/easebuzz'),
      `surl/furl=${callbackUrl}`
    ) && allOk;

  // Demo path: only shown when NODE_ENV !== production in checkout UI.
  // Server path for Easebuzz never calls demo confirm.
  console.log(
    `INFO | Demo UI path | checkout shows Demo Payment only when NODE_ENV!==production; default method=easebuzz`
  );
  console.log(
    `INFO | Amount source | createEasebuzzPaymentAction reads orders.grand_total from DB (never client amount)`
  );
  console.log(
    `INFO | Pipeline | webhook → PaymentService.processWebhookEvent → payment_events → order confirmed → payment_status paid → Nectar → Unicommerce`
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    check('Supabase admin', false, 'missing URL or service role');
    console.log('\nSTOP — cannot create dedicated test order.');
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
  const { data: brand } = await admin.from('brands').select('id').eq('slug', brandSlug).maybeSingle();
  if (!brand?.id) {
    check('Brand resolve', false, `slug=${brandSlug}`);
    process.exit(1);
  }

  // Prefer a real low-priced variant >= 1.00 INR (Easebuzz minimum)
  const { data: variants } = await admin
    .from('product_variants')
    .select('id, price, product_id, sku, title')
    .gte('price', 1)
    .order('price', { ascending: true })
    .limit(5);

  const variant = variants?.[0];
  if (!variant) {
    check('Catalog variant', false, 'no variant with price >= 1');
    process.exit(1);
  }

  const amount = Number(variant.price);
  const amountStr = amount.toFixed(2);
  const testEmail = `live-smoke-${Date.now()}@streetplayr.test`;
  const ORG_ID = '00000000-0000-0000-0000-000000000001';

  const { data: customer, error: custErr } = await admin
    .from('customers')
    .insert({
      organization_id: ORG_ID,
      brand_id: brand.id,
      email: testEmail,
      first_name: 'Live',
      last_name: 'Smoke',
    })
    .select('id')
    .single();

  if (custErr || !customer) {
    check('Create smoke customer', false, custErr?.message ?? 'unknown');
    process.exit(1);
  }

  const orderNumber = `LIVE-SMOKE-${Date.now().toString(36).toUpperCase()}`.slice(0, 40);
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      organization_id: ORG_ID,
      brand_id: brand.id,
      order_number: orderNumber,
      customer_id: customer.id,
      status: 'pending',
      fulfillment_status: 'unfulfilled',
      payment_status: 'pending',
      subtotal: amount,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      grand_total: amount,
      currency: 'INR',
      source: 'streetplayr',
      shipping_address: {
        line1: 'LIVE SMOKE TEST — DO NOT FULFILL',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'IN',
        phone: '9999999999',
        email: testEmail,
      },
      notes: 'LIVE_SMOKE_TEST_DEDICATED',
    })
    .select('id, order_number, grand_total, status, payment_status, payment_intent_id, currency')
    .single();

  if (orderErr || !order) {
    check('Create dedicated test order', false, orderErr?.message ?? 'unknown');
    process.exit(1);
  }

  // Persist order item for Unicommerce path if payment later succeeds
  await admin.from('order_items').insert({
    order_id: order.id,
    variant_id: variant.id,
    product_id: variant.product_id,
    product_title: 'LIVE SMOKE TEST ITEM',
    variant_title: variant.title ?? variant.sku ?? 'smoke',
    sku: variant.sku ?? null,
    quantity: 1,
    unit_price: amount,
    total_price: amount,
  });

  const reloaded = await admin
    .from('orders')
    .select('id, order_number, grand_total, status, payment_status, payment_intent_id')
    .eq('id', order.id)
    .single();

  const dbAmount = Number(reloaded.data?.grand_total).toFixed(2);
  allOk =
    check(
      'Order amount server-derived',
      dbAmount === amountStr && reloaded.data?.status === 'pending',
      `orderId=${order.id} grand_total=${dbAmount} status=${reloaded.data?.status} payment_status=${reloaded.data?.payment_status}`
    ) && allOk;
  allOk =
    check(
      'No payment attempt yet',
      !reloaded.data?.payment_intent_id,
      `payment_intent_id=${reloaded.data?.payment_intent_id ?? 'null'}`
    ) && allOk;
  allOk =
    check(
      'Dedicated smoke order',
      order.order_number.startsWith('LIVE-SMOKE'),
      `order_number=${order.order_number}`
    ) && allOk;

  console.log('\n=== STOP — AWAITING YOUR EXPLICIT CONFIRMATION ===\n');
  console.log(`ORDER_ID: ${order.id}`);
  console.log(`ORDER_NUMBER: ${order.order_number}`);
  console.log(`FINAL_AMOUNT_INR: ${dbAmount}`);
  console.log(`CURRENCY: INR`);
  console.log(`PAYMENT_ENDPOINT: ${initiateEndpoint}`);
  console.log(`CHECKOUT_REDIRECT_BASE: ${payHost}/pay/{accessKey}`);
  console.log(`CALLBACK_SURL_FURL: ${callbackUrl}`);
  console.log(`EASEBUZZ_ENV: ${envRaw || 'MISSING'}`);
  console.log(`PREFLIGHT_READY: ${allOk ? 'YES' : 'NO'}`);
  console.log('\nNo initiateLink call was made. No payment session was created.');
  console.log('Reply explicitly to authorize ONE live initiate + browser payment for this ORDER_ID only.');

  // Write non-secret state for a future authorized run
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts', '.live-smoke-preflight.json'),
    JSON.stringify(
      {
        orderId: order.id,
        orderNumber: order.order_number,
        amount: dbAmount,
        payHost,
        initiateEndpoint,
        callbackUrl,
        createdAt: new Date().toISOString(),
        paymentSubmitted: false,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * One-off Easebuzz sandbox E2E runner — not part of production bundle.
 * Usage: npx tsx scripts/easebuzz-sandbox-e2e.ts
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const REPORT: Record<string, string> = {};
const ORG_ID = '00000000-0000-0000-0000-000000000001';

function log(section: string, msg: string) {
  console.log(`[${section}] ${msg}`);
}

async function main() {
  const merchantKey = process.env.EASEBUZZ_MERCHANT_KEY?.trim();
  const salt = process.env.EASEBUZZ_SALT?.trim();
  const env = process.env.EASEBUZZ_ENV === 'prod' ? 'prod' : 'test';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  REPORT['SANDBOX CONFIG'] =
    merchantKey && salt && env === 'test' ? 'PASS' : 'FAIL';

  if (!merchantKey || !salt || !supabaseUrl || !serviceKey) {
    console.error('Missing required env vars');
    process.exit(1);
  }

  if (env !== 'test') {
    console.error('EASEBUZZ_ENV is not test — aborting');
    process.exit(1);
  }

  const host = env === 'test' ? 'https://testpay.easebuzz.in' : 'https://pay.easebuzz.in';
  log('CONFIG', `env=${env} host=${host} siteUrl=${siteUrl}`);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find a real variant + price from DB
  const { data: variant } = await admin
    .from('product_variants')
    .select('id, price, sku, title, product_id, product:products(title)')
    .gt('price', 0)
    .limit(1)
    .maybeSingle();

  if (!variant) {
    REPORT['PAYMENT INITIATION'] = 'BLOCKED';
    console.error('No product variant in DB');
    printReport();
    process.exit(1);
  }

  const price = Number(variant.price);
  log('PRODUCT', `variant=${variant.id} price=${price}`);

  // Resolve brand by slug (same as resolveStorefrontBrandId)
  const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
  const { data: brandRow } = await admin
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .maybeSingle();
  const brandId = brandRow?.id;
  if (!brandId) {
    console.error(`Brand not found for slug ${brandSlug}`);
    process.exit(1);
  }

  // Create/find test customer
  const testEmail = `easebuzz-e2e-${Date.now()}@streetplayr.test`;
  const { data: customer, error: custErr } = await admin
    .from('customers')
    .insert({
      organization_id: ORG_ID,
      brand_id: brandId,
      email: testEmail,
      first_name: 'Easebuzz',
      last_name: 'E2E',
    })
    .select('id')
    .single();

  if (custErr || !customer) {
    console.error('Customer create failed', custErr?.message);
    process.exit(1);
  }

  const orderNumber = `E2E-${Date.now().toString(36).toUpperCase()}`;
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      organization_id: ORG_ID,
      brand_id: brandId,
      order_number: orderNumber,
      customer_id: customer.id,
      status: 'pending',
      fulfillment_status: 'unfulfilled',
      payment_status: 'pending',
      subtotal: price,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      grand_total: price,
      currency: 'INR',
      source: 'streetplayr',
      shipping_address: {
        line1: '123 Test St',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'IN',
        phone: '9999999999',
        email: testEmail,
      },
      notes: '00000000-0000-0000-0000-000000000099',
    })
    .select('id, grand_total, status, payment_status, payment_intent_id')
    .single();

  if (orderErr || !order) {
    console.error('Order create failed', orderErr?.message);
    process.exit(1);
  }

  log('ORDER', `created id=${order.id} total=${order.grand_total}`);

  const txnid = `${orderNumber}-PAY`;
  const amountStr = Number(order.grand_total).toFixed(2);
  const productInfo = 'Streetplayr Order';
  const firstname = 'Easebuzz';
  const hashString = `${merchantKey}|${txnid}|${amountStr}|${productInfo}|${firstname}|${testEmail}|${order.id}||||||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const payload = new URLSearchParams({
    key: merchantKey,
    txnid,
    amount: amountStr,
    productinfo: productInfo,
    firstname,
    email: testEmail,
    phone: '9999999999',
    surl: `${siteUrl}/api/webhooks/easebuzz`,
    furl: `${siteUrl}/api/webhooks/easebuzz`,
    hash,
    udf1: order.id,
  });

  const initRes = await fetch(`${host}/payment/initiateLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });
  const initData = await initRes.json().catch(() => null);

  if (!initData || initData.status !== 1 || !initData.data) {
    REPORT['PAYMENT INITIATION'] = 'FAIL';
    REPORT['EASEBUZZ CHECKOUT'] = 'FAIL';
    console.error('initiateLink failed:', initData?.error_desc || initData);
    printReport();
    process.exit(1);
  }

  REPORT['PAYMENT INITIATION'] = 'PASS';
  const paymentUrl = `${host}/pay/${initData.data}`;
  log('INIT', `txnid=${txnid} paymentUrl=${paymentUrl}`);

  await admin.from('orders').update({ payment_intent_id: txnid }).eq('id', order.id);

  const { data: orderAfterInit } = await admin
    .from('orders')
    .select('payment_intent_id, grand_total')
    .eq('id', order.id)
    .single();

  if (orderAfterInit?.payment_intent_id !== txnid) {
    REPORT['PAYMENT INITIATION'] = 'FAIL';
    console.error('txnid not stored on order');
  } else {
    log('TXNID', 'stored on order.payment_intent_id');
  }

  // Verify amount from DB used (not client tamper)
  if (Number(orderAfterInit?.grand_total).toFixed(2) !== amountStr) {
    REPORT['AMOUNT'] = 'FAIL';
  }

  // Output for playwright phase
  const stateFile = path.join(process.cwd(), 'scripts', '.easebuzz-e2e-state.json');
  fs.writeFileSync(
    stateFile,
    JSON.stringify({
      orderId: order.id,
      txnid,
      paymentUrl,
      amount: amountStr,
      host,
      siteUrl,
      testEmail,
      saltConfigured: !!salt,
    }, null, 2)
  );

  console.log('\n=== E2E STATE WRITTEN ===');
  console.log(`ORDER_ID=${order.id}`);
  console.log(`TXNID=${txnid}`);
  console.log(`PAYMENT_URL=${paymentUrl}`);
  console.log(`CALLBACK_URL=${siteUrl}/api/webhooks/easebuzz`);
  printReport();
}

function printReport() {
  console.log('\n=== PARTIAL REPORT ===');
  for (const [k, v] of Object.entries(REPORT)) console.log(`${k}: ${v}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

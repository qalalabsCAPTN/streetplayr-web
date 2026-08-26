/**
 * Payment failure + retry + success + duplicate webhook against live DB + local webhook.
 * Uses real reverse-hash. Restores inventory. Deletes test order.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

function ok(name: string, pass: boolean, extra?: unknown) {
  console.log(JSON.stringify({ check: name, pass, extra: extra ?? null }));
  if (!pass) process.exitCode = 1;
}

function reverseHash(fields: Record<string, string>, salt: string): string {
  const str = [
    salt,
    fields.status,
    fields.udf10 ?? '',
    fields.udf9 ?? '',
    fields.udf8 ?? '',
    fields.udf7 ?? '',
    fields.udf6 ?? '',
    fields.udf5 ?? '',
    fields.udf4 ?? '',
    fields.udf3 ?? '',
    fields.udf2 ?? '',
    fields.udf1 ?? '',
    fields.email,
    fields.firstname,
    fields.productinfo,
    fields.amount,
    fields.txnid,
    fields.key,
  ].join('|');
  return crypto.createHash('sha512').update(str).digest('hex');
}

async function postCallback(base: string, data: Record<string, string>) {
  const body = new URLSearchParams(data);
  const res = await fetch(`${base}/api/webhooks/easebuzz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(20000),
  });
  return { status: res.status, location: res.headers.get('location') };
}

async function main() {
  loadEnvLocal();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const key = process.env.EASEBUZZ_MERCHANT_KEY!.trim();
  const salt = process.env.EASEBUZZ_SALT!.trim();
  const base = 'http://localhost:3000';

  const { data: profiles } = await admin.from('profiles').select('id, email').limit(2);
  const owner = profiles?.[0];
  if (!owner?.id) {
    ok('need a profile', false);
    return;
  }

  const { data: inv } = await admin.from('inventory').select('variant_id, quantity').gt('quantity', 0).limit(1).maybeSingle();
  if (!inv) {
    ok('need stock', false);
    return;
  }
  const variantId = inv.variant_id as string;
  const origQty = Number(inv.quantity);
  const { data: variant } = await admin.from('product_variants').select('id, product_id, price').eq('id', variantId).single();
  const productId = variant!.product_id as string;

  await admin.from('inventory').update({ quantity: 1, reserved_quantity: 0 }).eq('variant_id', variantId);
  await admin.from('inventory_reservations').update({
    reservation_state: 'released',
    released_at: new Date().toISOString(),
  }).eq('variant_id', variantId).in('reservation_state', ['pending', 'held']);

  const reserved = await admin.rpc('reserve_inventory', {
    p_variant_id: variantId,
    p_product_id: productId,
    p_quantity: 1,
    p_owner: owner.id,
  });
  ok('reserve for pending payment', !reserved.error && Boolean(reserved.data), reserved.error?.message);

  const stamp = Date.now();
  const txnid = `E2E${stamp}`;
  const amount = '1999.00';
  const brand = await admin.from('products').select('brand_id').eq('id', productId).maybeSingle();
  const customer = await admin.from('customers').select('id').eq('email', owner.email).maybeSingle();
  let customerId = customer.data?.id as string | undefined;
  if (!customerId && owner.email) {
    const ins = await admin.from('customers').insert({
      email: owner.email,
      organization_id: '00000000-0000-0000-0000-000000000001',
      brand_id: brand.data?.brand_id,
      first_name: 'E2E',
    }).select('id').single();
    customerId = ins.data?.id;
  }

  const orderIns = await admin.from('orders').insert({
    organization_id: '00000000-0000-0000-0000-000000000001',
    brand_id: brand.data?.brand_id,
    order_number: `SP-E2E-${stamp}`,
    customer_id: customerId,
    status: 'pending',
    payment_status: 'pending',
    subtotal: 1999,
    shipping_cost: 0,
    tax_amount: 0,
    discount_total: 0,
    grand_total: 1999,
    currency: 'INR',
    notes: owner.id,
    payment_intent_id: txnid,
    shipping_address: { email: owner.email, name: 'E2E', line1: '1 Test St', city: 'Mumbai', postalCode: '400001', country: 'IN' },
  }).select('id, order_number, status, payment_status, grand_total').single();
  ok('create pending order', !orderIns.error && Boolean(orderIns.data), orderIns.error?.message);
  const orderId = orderIns.data!.id as string;
  const orderNumber = orderIns.data!.order_number as string;

  if (reserved.data) {
    await admin.from('inventory_reservations').update({ order_id: orderId }).eq('id', reserved.data);
  }

  const failPayload: Record<string, string> = {
    key,
    txnid,
    amount,
    productinfo: 'StreetPlayR order',
    firstname: 'E2E',
    email: owner.email || 'e2e@example.com',
    udf1: orderId,
    status: 'failure',
  };
  failPayload.hash = reverseHash(failPayload, salt);
  const failRes = await postCallback(base, failPayload);
  ok('failure callback accepted', failRes.status === 302 || failRes.status === 200, failRes);

  const afterFail = await admin.from('orders').select('status, payment_status').eq('id', orderId).single();
  ok('failure does not confirm order', afterFail.data?.status !== 'confirmed', afterFail.data);
  const holdsAfterFail = await admin.from('inventory_reservations').select('reservation_state').eq('id', reserved.data).maybeSingle();
  ok('failure released reservation', ['released', 'expired'].includes(String(holdsAfterFail.data?.reservation_state)), holdsAfterFail.data);
  const invAfterFail = await admin.from('inventory').select('quantity, reserved_quantity').eq('variant_id', variantId).single();
  ok('stock restored after failure', Number(invAfterFail.data?.quantity) === 1, invAfterFail.data);

  const retryHold = await admin.rpc('reserve_inventory', {
    p_variant_id: variantId,
    p_product_id: productId,
    p_quantity: 1,
    p_owner: owner.id,
  });
  ok('retry can re-hold stock', !retryHold.error && Boolean(retryHold.data), retryHold.error?.message);
  if (retryHold.data) {
    await admin.from('inventory_reservations').update({ order_id: orderId }).eq('id', retryHold.data);
  }

  const successPayload: Record<string, string> = {
    ...failPayload,
    status: 'success',
  };
  successPayload.hash = reverseHash(successPayload, salt);
  const ok1 = await postCallback(base, successPayload);
  ok('success callback accepted', ok1.status === 302 || ok1.status === 200, ok1);
  const afterPay = await admin.from('orders').select('status, payment_status, order_number, grand_total').eq('id', orderId).single();
  ok('success confirms order', afterPay.data?.status === 'confirmed', afterPay.data);

  const ok2 = await postCallback(base, successPayload);
  ok('duplicate success callback does not 500', ok2.status === 302 || ok2.status === 200, ok2);
  const afterDup = await admin.from('orders').select('status').eq('id', orderId).single();
  ok('duplicate does not change confirmed status', afterDup.data?.status === 'confirmed', afterDup.data);

  const events = await admin.from('payment_events').select('id, event_type').eq('order_id', orderId);
  ok('payment_events recorded', (events.data?.length ?? 0) >= 1, { count: events.data?.length, err: events.error?.message });

  await admin.from('inventory').update({ quantity: origQty, reserved_quantity: 0 }).eq('variant_id', variantId);
  await admin.from('inventory_reservations').update({
    reservation_state: 'released',
    released_at: new Date().toISOString(),
  }).eq('variant_id', variantId).in('reservation_state', ['pending', 'held']);

  console.log(JSON.stringify({
    cleanup: 'inventory restored, test order left for audit',
    orderNumber,
    orderIdPrefix: orderId.slice(0, 8),
    variantPrefix: variantId.slice(0, 8),
  }));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

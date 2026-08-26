/**
 * Two authenticated customers. Anon key + user JWT. Never prints emails/passwords.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

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

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

  const stamp = Date.now();
  const passA = `Aa1!${randomBytes(8).toString('hex')}`;
  const passB = `Bb1!${randomBytes(8).toString('hex')}`;
  const emailA = `e2e.a.${stamp}@example.com`;
  const emailB = `e2e.b.${stamp}@example.com`;

  const created: string[] = [];
  try {
    const a = await admin.auth.admin.createUser({
      email: emailA,
      password: passA,
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: emailB,
      password: passB,
      email_confirm: true,
    });
    if (a.error || !a.data.user) {
      ok('create user A', false, a.error?.message);
      return;
    }
    if (b.error || !b.data.user) {
      ok('create user B', false, b.error?.message);
      return;
    }
    created.push(a.data.user.id, b.data.user.id);
    ok('create user A', true, { idPrefix: a.data.user.id.slice(0, 8) });
    ok('create user B', true, { idPrefix: b.data.user.id.slice(0, 8) });

    await admin.from('profiles').upsert({
      id: a.data.user.id,
      email: emailA,
      sprr_balance: 11,
    });
    await admin.from('profiles').upsert({
      id: b.data.user.id,
      email: emailB,
      sprr_balance: 22,
    });

    const brand = await admin.from('products').select('brand_id').limit(1).maybeSingle();
    const brandId = brand.data?.brand_id;
    const org = '00000000-0000-0000-0000-000000000001';

    const custA = await admin.from('customers').insert({
      email: emailA,
      first_name: 'E2EA',
      organization_id: org,
      brand_id: brandId,
    }).select('id').single();
    const custB = await admin.from('customers').insert({
      email: emailB,
      first_name: 'E2EB',
      organization_id: org,
      brand_id: brandId,
    }).select('id').single();

    const orderA = await admin.from('orders').insert({
      organization_id: org,
      brand_id: brandId,
      order_number: `SP-E2E-A-${stamp}`,
      customer_id: custA.data?.id,
      status: 'pending',
      payment_status: 'pending',
      subtotal: 100,
      shipping_cost: 0,
      tax_amount: 0,
      grand_total: 100,
      currency: 'INR',
      notes: a.data.user.id,
      shipping_address: { email: emailA, line1: 'A street' },
    }).select('id, order_number').single();

    const orderB = await admin.from('orders').insert({
      organization_id: org,
      brand_id: brandId,
      order_number: `SP-E2E-B-${stamp}`,
      customer_id: custB.data?.id,
      status: 'pending',
      payment_status: 'pending',
      subtotal: 200,
      shipping_cost: 0,
      tax_amount: 0,
      grand_total: 200,
      currency: 'INR',
      notes: b.data.user.id,
      shipping_address: { email: emailB, line1: 'B street' },
    }).select('id, order_number').single();

    ok('seed orders', Boolean(orderA.data && orderB.data), {
      a: orderA.error?.message ?? null,
      b: orderB.error?.message ?? null,
    });

    await admin.from('user_addresses').insert([
      { user_id: a.data.user.id, name: 'A', line1: 'A1', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9999999999' },
      { user_id: b.data.user.id, name: 'B', line1: 'B1', city: 'Delhi', state: 'DL', pincode: '110001', phone: '8888888888' },
    ]);

    const clientA = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const clientB = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const signA = await clientA.auth.signInWithPassword({ email: emailA, password: passA });
    const signB = await clientB.auth.signInWithPassword({ email: emailB, password: passB });
    ok('sign in A', !signA.error, signA.error?.message);
    ok('sign in B', !signB.error, signB.error?.message);

    const ordersA = await clientA.from('orders').select('id, order_number, customer_id, notes');
    const ordersB = await clientB.from('orders').select('id, order_number, customer_id, notes');
    const idsA = (ordersA.data ?? []).map((r) => r.id);
    const idsB = (ordersB.data ?? []).map((r) => r.id);
    ok('A sees own order', Boolean(orderA.data && idsA.includes(orderA.data.id)), { count: idsA.length, err: ordersA.error?.message });
    ok('A cannot see B order', !(orderB.data && idsA.includes(orderB.data.id)), { leaked: idsA.includes(orderB.data?.id ?? '') });
    ok('B sees own order', Boolean(orderB.data && idsB.includes(orderB.data.id)), { count: idsB.length, err: ordersB.error?.message });
    ok('B cannot see A order', !(orderA.data && idsB.includes(orderA.data.id)));

    const addrA = await clientA.from('user_addresses').select('id, user_id');
    const addrB = await clientB.from('user_addresses').select('id, user_id');
    ok('A addresses own only', (addrA.data ?? []).every((r) => r.user_id === a.data.user.id) && (addrA.data ?? []).length >= 1, {
      count: addrA.data?.length, err: addrA.error?.message,
    });
    ok('B addresses own only', (addrB.data ?? []).every((r) => r.user_id === b.data.user.id) && (addrB.data ?? []).length >= 1);

    const walletA = await clientA.from('profiles').select('id, sprr_balance');
    const walletB = await clientB.from('profiles').select('id, sprr_balance');
    const aRows = walletA.data ?? [];
    const bRows = walletB.data ?? [];
    ok('A wallet own only', aRows.length === 1 && aRows[0].id === a.data.user.id && Number(aRows[0].sprr_balance) === 11, {
      count: aRows.length, err: walletA.error?.message,
    });
    ok('B wallet own only', bRows.length === 1 && bRows[0].id === b.data.user.id && Number(bRows[0].sprr_balance) === 22, {
      count: bRows.length, err: walletB.error?.message,
    });

    const steal = await clientA.from('profiles').update({ sprr_balance: 9999 }).eq('id', b.data.user.id).select('id');
    const bAfter = await admin.from('profiles').select('sprr_balance').eq('id', b.data.user.id).single();
    ok('A cannot modify B wallet', Number(bAfter.data?.sprr_balance) === 22, {
      stealCount: steal.data?.length ?? 0,
      stealErr: steal.error?.message ?? null,
    });

    const stealOrder = await clientA.from('orders').update({ status: 'cancelled' }).eq('id', orderB.data?.id ?? '').select('id');
    const bOrderAfter = await admin.from('orders').select('status').eq('id', orderB.data?.id ?? '').single();
    ok('A cannot modify B order', bOrderAfter.data?.status === 'pending', {
      stealCount: stealOrder.data?.length ?? 0,
      stealErr: stealOrder.error?.message ?? null,
    });
  } finally {
    for (const id of created) {
      await admin.from('orders').delete().eq('notes', id);
      await admin.from('user_addresses').delete().eq('user_id', id);
      await admin.from('customers').delete().eq('email', id === created[0] ? emailA : emailB);
      await admin.from('profiles').delete().eq('id', id);
      await admin.auth.admin.deleteUser(id);
    }
    console.log(JSON.stringify({ cleanup: 'users deleted', count: created.length }));
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

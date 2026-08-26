/**
 * Prove 100008 landed. Then run reservation race + lifecycle against live DB.
 * Restores inventory after. Never prints secrets.
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

function ok(name: string, pass: boolean, extra?: unknown) {
  console.log(JSON.stringify({ check: name, pass, extra: extra ?? null }));
  if (!pass) process.exitCode = 1;
}

async function main() {
  loadEnvLocal();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const coupons = await admin.from('coupons').select('id').limit(1);
  ok('coupons table exists', !coupons.error, coupons.error?.message ?? null);

  const redemptions = await admin.from('coupon_redemptions').select('id').limit(1);
  ok('coupon_redemptions table exists', !redemptions.error, redemptions.error?.message ?? null);

  const quests = await admin.from('loyalty_quests').select('slug,is_active').limit(10);
  ok('loyalty_quests table exists', !quests.error, quests.error?.message ?? (quests.data ?? []).map((q) => q.slug));

  const progress = await admin.from('loyalty_quest_progress').select('user_id').limit(1);
  ok('loyalty_quest_progress table exists', !progress.error, progress.error?.message ?? null);

  const inv = await admin.from('inventory').select('variant_id,quantity,reserved_quantity').gt('quantity', 0).limit(5);
  ok('inventory readable', !inv.error && (inv.data?.length ?? 0) > 0, {
    error: inv.error?.message,
    rows: inv.data?.length ?? 0,
  });
  if (!inv.data?.length) {
    console.log(JSON.stringify({ abort: 'no positive inventory to race against' }));
    process.exit(1);
  }

  const pick = inv.data[0];
  const variantId = pick.variant_id as string;
  const { data: variant } = await admin.from('product_variants').select('id,product_id').eq('id', variantId).maybeSingle();
  const productId = variant?.product_id as string;
  if (!productId) {
    console.log(JSON.stringify({ abort: 'variant has no product_id', variantId }));
    process.exit(1);
  }

  const { data: profiles } = await admin.from('profiles').select('id').limit(3);
  const ownerA = profiles?.[0]?.id as string | undefined;
  const ownerB = profiles?.[1]?.id as string | undefined;
  if (!ownerA || !ownerB || ownerA === ownerB) {
    console.log(JSON.stringify({ abort: 'need two distinct profiles.id for reservation_owner FK' }));
    process.exit(1);
  }

  const snapshot = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
  const origQty = Number(snapshot.data?.quantity ?? 0);
  const origReserved = Number(snapshot.data?.reserved_quantity ?? 0);

  await admin.from('inventory').update({ quantity: 1, reserved_quantity: 0 }).eq('variant_id', variantId);
  await admin
    .from('inventory_reservations')
    .update({ reservation_state: 'released', released_at: new Date().toISOString() })
    .eq('variant_id', variantId)
    .in('reservation_state', ['pending', 'held']);

  const dummy = '00000000-0000-0000-0000-000000000000';
  const missing = await admin.rpc('reserve_inventory', {
    p_variant_id: dummy,
    p_product_id: dummy,
    p_quantity: 1,
    p_owner: dummy,
  });
  ok(
    'reserve_inventory no longer reports missing tables',
    !String(missing.error?.message ?? '').includes('Required tables'),
    missing.error?.message ?? null
  );

  const [a, b] = await Promise.all([
    admin.rpc('reserve_inventory', {
      p_variant_id: variantId,
      p_product_id: productId,
      p_quantity: 1,
      p_owner: ownerA,
    }),
    admin.rpc('reserve_inventory', {
      p_variant_id: variantId,
      p_product_id: productId,
      p_quantity: 1,
      p_owner: ownerB,
    }),
  ]);

  const successes = [a, b].filter((r) => !r.error && r.data);
  const failures = [a, b].filter((r) => r.error);
  ok('last-SKU race: exactly one reservation succeeds', successes.length === 1 && failures.length === 1, {
    successIds: successes.map((r) => r.data),
    failMsg: failures[0]?.error?.message ?? null,
  });

  const winnerId = successes[0]?.data as string | undefined;
  const { data: afterRace } = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
  ok('no negative inventory after race', Number(afterRace?.quantity ?? -1) >= 0 && Number(afterRace?.reserved_quantity ?? -1) >= 0, afterRace);
  ok('on-hand still 1 until convert', Number(afterRace?.quantity) === 1, afterRace);
  ok('reserved_quantity is 1 after unique hold', Number(afterRace?.reserved_quantity) === 1, afterRace);

  if (winnerId) {
    const again = await admin.rpc('reserve_inventory', {
      p_variant_id: variantId,
      p_product_id: productId,
      p_quantity: 1,
      p_owner: ownerA,
    });
    ok('third reserve fails while hold exists', Boolean(again.error), again.error?.message ?? again.data);

    const convert = await admin.rpc('convert_inventory_reservation', { p_reservation_id: winnerId });
    ok('convert_inventory_reservation succeeds', !convert.error, convert.error?.message ?? null);
    const { data: afterConvert } = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
    ok('convert decrements on-hand to 0', Number(afterConvert?.quantity) === 0, afterConvert);
    ok('convert clears reserved_quantity', Number(afterConvert?.reserved_quantity) === 0, afterConvert);

    const convertAgain = await admin.rpc('convert_inventory_reservation', { p_reservation_id: winnerId });
    ok('convert is idempotent', !convertAgain.error, convertAgain.error?.message ?? null);
    const { data: afterConvert2 } = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
    ok('second convert does not double-decrement', Number(afterConvert2?.quantity) === 0, afterConvert2);

    const release = await admin.rpc('release_inventory_reservation', { p_reservation_id: winnerId });
    ok('release after convert restores on-hand', !release.error, release.error?.message ?? null);
    const { data: afterRelease } = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
    ok('on-hand restored to 1 after convert-release', Number(afterRelease?.quantity) === 1, afterRelease);

    const releaseAgain = await admin.rpc('release_inventory_reservation', { p_reservation_id: winnerId });
    ok('release is idempotent', !releaseAgain.error, releaseAgain.error?.message ?? null);
  }

  await admin.from('inventory').update({ quantity: 1, reserved_quantity: 0 }).eq('variant_id', variantId);
  const exp = await admin.rpc('reserve_inventory', {
    p_variant_id: variantId,
    p_product_id: productId,
    p_quantity: 1,
    p_owner: ownerA,
    p_expires_at: new Date(Date.now() - 60_000).toISOString(),
  });
  ok('can create already-expired reservation', !exp.error, exp.error?.message ?? exp.data);
  const expiredRun = await admin.rpc('release_expired_reservations');
  ok('release_expired_reservations runs', !expiredRun.error, { released: expiredRun.data, error: expiredRun.error?.message });
  const { data: afterExpiry } = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
  ok('expiry restores reserved_quantity to 0', Number(afterExpiry?.reserved_quantity) === 0, afterExpiry);

  if (exp.data) {
    const { data: expRow } = await admin.from('inventory_reservations').select('reservation_state').eq('id', exp.data).maybeSingle();
    ok('expired reservation marked expired or released', ['expired', 'released'].includes(String(expRow?.reservation_state)), expRow);
  }

  await admin.from('inventory').update({ quantity: origQty, reserved_quantity: origReserved }).eq('variant_id', variantId);
  const { data: restored } = await admin.from('inventory').select('quantity,reserved_quantity').eq('variant_id', variantId).single();
  ok('original inventory restored', Number(restored?.quantity) === origQty, { origQty, origReserved, restored });

  console.log(JSON.stringify({ variantId, productId, origQty, origReserved, done: true }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

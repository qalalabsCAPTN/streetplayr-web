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
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: e2eOrders } = await admin.from('orders').select('id, order_number, status').like('order_number', 'SP-E2E-%');
  console.log(JSON.stringify({ e2eOrders: (e2eOrders ?? []).map((o) => ({ n: o.order_number, s: o.status })) }));

  for (const o of e2eOrders ?? []) {
    await admin.from('payment_events').delete().eq('order_id', o.id);
    await admin.from('order_items').delete().eq('order_id', o.id);
    await admin.from('inventory_reservations').update({
      reservation_state: 'released',
      released_at: new Date().toISOString(),
      order_id: null,
    }).eq('order_id', o.id);
    await admin.from('orders').delete().eq('id', o.id);
  }

  const variantId = '173e2a32-7c3f-4f0d-a9e6-96c91ca36029';
  const { data: holds } = await admin
    .from('inventory_reservations')
    .select('id, reserved_quantity, reservation_state')
    .eq('variant_id', variantId)
    .in('reservation_state', ['pending', 'held']);
  const reserved = (holds ?? []).reduce((s, r) => s + Number(r.reserved_quantity ?? 0), 0);
  const { data: inv } = await admin.from('inventory').select('quantity, reserved_quantity').eq('variant_id', variantId).single();
  await admin.from('inventory').update({ reserved_quantity: reserved }).eq('variant_id', variantId);
  const { data: after } = await admin.from('inventory').select('quantity, reserved_quantity').eq('variant_id', variantId).single();
  console.log(JSON.stringify({
    variantPrefix: variantId.slice(0, 8),
    before: inv,
    liveHolds: reserved,
    after,
  }));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

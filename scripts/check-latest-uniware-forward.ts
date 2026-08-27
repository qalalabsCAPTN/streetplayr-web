/**
 * Check whether the latest paid order was forwarded to Uniware.
 * Never prints emails, phones, addresses, or secrets.
 * Usage: npx tsx scripts/check-latest-uniware-forward.ts
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

function redact(msg: string) {
  return msg
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\+?\d[\d\s-]{8,}\d/g, '[phone]');
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Missing Supabase admin env' }));
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: orders, error } = await admin
    .from('orders')
    .select(
      'id, order_number, status, payment_status, grand_total, source_order_id, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !orders?.length) {
    console.log(JSON.stringify({ ok: false, error: error?.message ?? 'No orders found' }));
    process.exit(1);
  }

  const paid = orders.find((o) =>
    ['paid', 'captured'].includes(String(o.payment_status ?? '').toLowerCase())
    || ['confirmed', 'processing', 'fulfilling', 'shipped', 'delivered'].includes(String(o.status ?? '').toLowerCase())
  );
  const latest = paid ?? orders[0];

  const { data: items } = await admin
    .from('order_items')
    .select('sku, quantity, unit_price, product_title, variant_title')
    .eq('order_id', latest.id);

  const { data: events } = await admin
    .from('operational_events')
    .select('created_at, severity, action, message, resource_id')
    .or(
      `resource_id.eq.${latest.id},action.ilike.%unicommerce%,message.ilike.%${latest.id}%,message.ilike.%${latest.order_number}%`
    )
    .order('created_at', { ascending: false })
    .limit(30);

  const ucEvents = (events ?? [])
    .filter(
      (e) =>
        e.resource_id === latest.id
        || String(e.action ?? '').includes('unicommerce')
        || String(e.message ?? '').includes(latest.id)
        || String(e.message ?? '').includes(String(latest.order_number ?? ''))
    )
    .slice(0, 12)
    .map((e) => ({
      at: e.created_at,
      severity: e.severity,
      action: e.action,
      message: redact(String(e.message ?? '')).slice(0, 240),
    }));

  let uniwareLive: { found: boolean; status?: string; displayCode?: string; error?: string } | null =
    null;
  const uniwareCode = latest.source_order_id as string | null;
  if (uniwareCode) {
    try {
      const { UnicommerceService } = await import('../src/integrations/unicommerce');
      const live = await UnicommerceService.orders.getOrder(uniwareCode);
      uniwareLive = live
        ? {
            found: true,
            status: live.status,
            displayCode: live.displayOrderCode,
          }
        : { found: false };
    } catch (e) {
      uniwareLive = {
        found: false,
        error: e instanceof Error ? e.message.slice(0, 180) : 'getOrder failed',
      };
    }
  }

  const forwarded = Boolean(uniwareCode) || ucEvents.some((e) => e.action?.includes('create_success'));
  const failed = ucEvents.some(
    (e) =>
      e.action?.includes('unicommerce_forward_failed')
      || e.action?.includes('create_error')
  );

  console.log(
    JSON.stringify(
      {
        latest: {
          orderNumber: latest.order_number,
          status: latest.status,
          paymentStatus: latest.payment_status,
          grandTotal: latest.grand_total,
          createdAt: latest.created_at,
          sourceOrderId: uniwareCode || null,
        },
        items: (items ?? []).map((i) => ({
          sku: i.sku,
          qty: i.quantity,
          title: i.product_title || i.variant_title,
        })),
        forwardedToUniware: forwarded,
        forwardFailed: failed,
        uniwareLive,
        recentUcEvents: ucEvents,
        otherRecentOrders: orders.slice(0, 5).map((o) => ({
          orderNumber: o.order_number,
          status: o.status,
          paymentStatus: o.payment_status,
          grandTotal: o.grand_total,
          createdAt: o.created_at,
          sourceOrderId: o.source_order_id || null,
        })),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});

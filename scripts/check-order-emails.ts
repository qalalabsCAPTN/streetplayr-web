/**
 * Read-only: purchase email events for recent paid orders. Never prints emails.
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

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Missing admin env' }));
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: orders } = await admin
    .from('orders')
    .select('id, order_number, status, payment_status, grand_total, shipping_address, created_at')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(5);

  const rows = [];
  for (const o of orders ?? []) {
    const ship = (o.shipping_address ?? {}) as { email?: string };
    const { data: events } = await admin
      .from('operational_events')
      .select('created_at, action, severity')
      .eq('resource_id', o.id)
      .or('action.ilike.%notify%,action.ilike.%email%')
      .order('created_at', { ascending: false })
      .limit(12);
    rows.push({
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      grandTotal: o.grand_total,
      hasShippingEmail: Boolean(ship.email),
      emailEvents: events ?? [],
    });
  }
  const { count: confirmSent } = await admin
    .from('operational_events')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'notify.order_confirmation')
    .eq('severity', 'info');
  const { count: skipped } = await admin
    .from('operational_events')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'notify.email_not_configured');

  console.log(
    JSON.stringify(
      {
        smtpHostSet: Boolean(process.env.SMTP_HOST),
        notifyOrderConfirmationCount: confirmSent ?? 0,
        notifyEmailNotConfiguredCount: skipped ?? 0,
        orders: rows,
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

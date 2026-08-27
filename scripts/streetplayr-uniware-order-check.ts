/**
 * 100% UniWare order-forward check. No new sale order. No PII.
 * Usage: npx tsx scripts/streetplayr-uniware-order-check.ts [ORDER_NUMBER]
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  buildUnicommerceSoapUrl,
  getUnicommerceConfig,
  isUnicommerceLiveConfigured,
} from '../src/integrations/unicommerce/config';
import { buildCreateSaleOrderSoapBody, xmlEscape } from '../src/integrations/unicommerce/sale-order-soap';

const TARGET = process.argv[2] || 'SP-20260827-28EAB7';
const INSPIRED_SKU = 'PS-TEE-INS-PRP-M';

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

function tag(xml: string, name: string): string {
  const re = new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, 'i');
  return xml.match(re)?.[1]?.trim() ?? '';
}

function parseErrors(xml: string) {
  const errors: Array<{ code?: string; message?: string; description?: string }> = [];
  const errorTag = /<([^>:]+:)?Error\b([^>]*)\/?>/gi;
  let em;
  while ((em = errorTag.exec(xml))) {
    const attrs = em[2] || '';
    errors.push({
      code: attrs.match(/code="([^"]*)"/i)?.[1],
      message: attrs.match(/message="([^"]*)"/i)?.[1],
      description: attrs.match(/description="([^"]*)"/i)?.[1],
    });
  }
  return errors;
}

async function soap(operation: string, body: string) {
  const config = getUnicommerceConfig();
  const url = buildUnicommerceSoapUrl(config.apiUrl, config.facilityCode);
  const envelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${xmlEscape(config.username)}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlEscape(config.password)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>${body}</soapenv:Body>
</soapenv:Envelope>`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: operation,
      Facility: config.facilityCode,
    },
    body: envelope,
  });
  return { status: res.status, xml: await res.text(), soapHost: new URL(url).host };
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Missing Supabase admin env' }));
    process.exit(1);
  }

  const config = getUnicommerceConfig();
  const liveConfigured = isUnicommerceLiveConfigured(config);
  const channel = process.env.UNICOMMERCE_CHANNEL_CODE?.trim() || 'CUSTOM';
  const soapHost = liveConfigured
    ? new URL(buildUnicommerceSoapUrl(config.apiUrl, config.facilityCode)).host
    : null;

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const inspiredItem = liveConfigured
    ? await soap(
        'GetItemTypeRequest',
        `<ser:GetItemTypeRequest><ser:SkuCode>${INSPIRED_SKU}</ser:SkuCode></ser:GetItemTypeRequest>`
      )
    : null;
  const inspiredOk =
    inspiredItem && tag(inspiredItem.xml, 'Successful') === 'true' && tag(inspiredItem.xml, 'SkuCode') === INSPIRED_SKU;

  const { data: target } = await admin
    .from('orders')
    .select('id, order_number, status, payment_status, grand_total, source_order_id, created_at')
    .eq('order_number', TARGET)
    .maybeSingle();

  const { data: items } = target
    ? await admin.from('order_items').select('sku, quantity, unit_price, variant_id').eq('order_id', target.id)
    : { data: [] as Array<{ sku: string | null; quantity: number; unit_price: number; variant_id: string | null }> };

  const orderSkus = (items ?? []).map((i) => String(i.sku || '')).filter(Boolean);
  const skuLive: Array<{ sku: string; uniware: boolean; db: boolean; enabled?: string }> = [];
  for (const sku of orderSkus) {
    const { data: dbVar } = await admin
      .from('product_variants')
      .select('id, sku')
      .eq('sku', sku)
      .maybeSingle();
    let uni = false;
    let enabled: string | undefined;
    if (liveConfigured) {
      const got = await soap(
        'GetItemTypeRequest',
        `<ser:GetItemTypeRequest><ser:SkuCode>${xmlEscape(sku)}</ser:SkuCode></ser:GetItemTypeRequest>`
      );
      uni = tag(got.xml, 'Successful') === 'true' && tag(got.xml, 'SkuCode') === sku;
      enabled = tag(got.xml, 'Enabled') || undefined;
    }
    skuLive.push({ sku, uniware: uni, db: Boolean(dbVar), enabled });
  }

  let saleOrder: { found: boolean; status?: string; displayCode?: string; itemSkus?: string[] } | null = null;
  if (liveConfigured && target?.source_order_id) {
    const got = await soap(
      'GetSaleOrderRequest',
      `<ser:GetSaleOrderRequest><ser:SaleOrder><ser:Code>${xmlEscape(String(target.source_order_id))}</ser:Code></ser:SaleOrder></ser:GetSaleOrderRequest>`
    );
    const ok = tag(got.xml, 'Successful') === 'true';
    const itemSkus = [...got.xml.matchAll(/<(?:[\w-]+:)?ItemSKU(?:\s[^>]*)?>([^<]+)<\/(?:[\w-]+:)?ItemSKU>/gi)].map(
      (m) => m[1]
    );
    saleOrder = {
      found: ok,
      status: tag(got.xml, 'Status') || tag(got.xml, 'StatusCode') || undefined,
      displayCode: tag(got.xml, 'DisplayOrderCode') || undefined,
      itemSkus,
    };
  }

  const dryRunXml = target
    ? buildCreateSaleOrderSoapBody({
        id: target.id,
        displayCode: target.order_number,
        createdAt: target.created_at,
        currency: 'INR',
        channelCode: channel,
        facilityCode: config.facilityCode,
        paymentAmount: Number(target.grand_total ?? 0),
        shippingAddress: {
          name: 'Check',
          addressLine1: '1',
          city: 'Delhi',
          state: 'DL',
          country: 'IN',
          pincode: '110001',
          phone: '9999999999',
          email: 'check@example.com',
        },
        items: (items ?? []).map((i) => ({
          sku: String(i.sku || ''),
          price: Number(i.unit_price ?? 0),
          quantity: Number(i.quantity ?? 1),
        })),
      })
    : '';
  const itemCodes = [...dryRunXml.matchAll(/<ser:Code>([^<]+)<\/ser:Code>/g)]
    .map((m) => m[1])
    .filter((c) => c !== target?.id);
  const itemSkusInXml = [...dryRunXml.matchAll(/<ser:ItemSKU>([^<]+)<\/ser:ItemSKU>/g)].map((m) => m[1]);

  const { data: idem } = target
    ? await admin
        .from('idempotency_keys')
        .select('key, status, expires_at')
        .eq('key', `unicommerce:order_create:${target.id}`)
        .maybeSingle()
    : { data: null };

  const { data: events } = target
    ? await admin
        .from('operational_events')
        .select('created_at, severity, action, message')
        .or(`resource_id.eq.${target.id},action.ilike.%unicommerce%`)
        .order('created_at', { ascending: false })
        .limit(40)
    : { data: [] as any[] };

  const ucEvents = (events ?? [])
    .filter(
      (e) =>
        String(e.message ?? '').includes(target?.id ?? '')
        || String(e.message ?? '').includes(TARGET)
        || String(e.action ?? '').includes('unicommerce')
        || String(e.action ?? '').includes('uniware')
    )
    .slice(0, 8)
    .map((e) => ({
      at: e.created_at,
      severity: e.severity,
      action: e.action,
      message: String(e.message ?? '')
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
        .slice(0, 180),
    }));

  const { data: unpushed } = await admin
    .from('orders')
    .select('order_number, status, payment_status, grand_total, created_at')
    .eq('payment_status', 'paid')
    .is('source_order_id', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentPaid } = await admin
    .from('orders')
    .select('order_number, status, payment_status, source_order_id, grand_total, created_at')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(8);

  const skuGaps = skuLive.filter((s) => !s.uniware || !s.db);
  const emptySku = (items ?? []).some((i) => !i.sku);
  const longItemCode = itemCodes.some((c) => c.length > 45);
  const xmlHasChannel = dryRunXml.includes(`<ser:Channel>${channel}</ser:Channel>`);
  const xmlSkusMatch = itemSkusInXml.every((s) => orderSkus.includes(s)) && orderSkus.length === itemSkusInXml.length;

  const oldForwardOk = Boolean(target?.source_order_id) && Boolean(saleOrder?.found);
  const nextOrderReady =
    liveConfigured
    && inspiredOk
    && !emptySku
    && skuGaps.length === 0
    && !longItemCode
    && xmlHasChannel
    && xmlSkusMatch
    && channel === 'CUSTOM'
    && (unpushed ?? []).length === 0;

  console.log(
    JSON.stringify(
      {
        config: {
          liveConfigured,
          soapHost,
          channel,
          facilitySet: Boolean(config.facilityCode),
          transport: config.transportMode,
          demoMode: config.isDemoMode,
        },
        catalogPing: {
          sku: INSPIRED_SKU,
          uniwareItemExists: Boolean(inspiredOk),
        },
        previousPaidOrder: target
          ? {
              orderNumber: target.order_number,
              status: target.status,
              paymentStatus: target.payment_status,
              grandTotal: target.grand_total,
              createdAt: target.created_at,
              sourceOrderId: target.source_order_id || null,
              items: (items ?? []).map((i) => ({ sku: i.sku, qty: i.quantity })),
              skuVsUniware: skuLive,
              uniwareSaleOrder: saleOrder,
              idempotency: idem ? { status: idem.status, expiresAt: idem.expires_at } : null,
              soapDryRun: {
                channelOk: xmlHasChannel,
                itemCodesMaxLen: itemCodes.reduce((m, c) => Math.max(m, c.length), 0),
                itemCodeOver45: longItemCode,
                itemSkus: itemSkusInXml,
                emptySku,
              },
              recentUcEvents: ucEvents,
            }
          : { missing: true, orderNumber: TARGET },
        unpushedPaidOrders: (unpushed ?? []).map((o) => ({
          orderNumber: o.order_number,
          status: o.status,
          grandTotal: o.grand_total,
          createdAt: o.created_at,
        })),
        recentPaid: (recentPaid ?? []).map((o) => ({
          orderNumber: o.order_number,
          status: o.status,
          sourceOrderId: o.source_order_id || null,
          createdAt: o.created_at,
        })),
        verdict: {
          previousOrderInUniware: oldForwardOk,
          unpushedPaidCount: (unpushed ?? []).length,
          nextPaidOrderWillPushIfWebhookHasUrl: nextOrderReady,
          blockers: [
            !liveConfigured ? 'LOCAL_UNICOMMERCE_CONFIG' : null,
            !inspiredOk ? 'INSPIRED_SKU_MISSING_IN_UNIWARE' : null,
            emptySku ? 'ORDER_ITEM_SKU_EMPTY' : null,
            skuGaps.length ? 'ORDER_SKU_NOT_IN_UNIWARE_OR_DB' : null,
            longItemCode ? 'ITEM_CODE_OVER_45' : null,
            !xmlHasChannel ? 'CHANNEL_MISSING_IN_SOAP' : null,
            channel !== 'CUSTOM' ? `CHANNEL_NOT_CUSTOM:${channel}` : null,
            (unpushed ?? []).length ? 'PAID_ORDERS_STILL_UNPUSHED' : null,
          ].filter(Boolean),
        },
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

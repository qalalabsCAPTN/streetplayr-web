/**
 * Retry Uniware CreateSaleOrder for a paid order without importing server-only.
 * Never prints emails, phones, addresses, passwords, or SOAP bodies.
 * Usage: npx tsx scripts/retry-uniware-forward.ts SP-20260827-28EAB7
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  buildUnicommerceSoapUrl,
  getUnicommerceConfig,
} from '../src/integrations/unicommerce/config';
import { buildCreateSaleOrderSoapBody, xmlEscape } from '../src/integrations/unicommerce/sale-order-soap';
import { unicommerceShipTo } from '../lib/commerce/address';

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
  const xml = await res.text();
  return { status: res.status, xml, soapHost: new URL(url).host };
}

async function main() {
  loadEnvLocal();
  const needle = process.argv[2] || 'SP-20260827-28EAB7';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Missing Supabase admin env' }));
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: order, error } = await admin
    .from('orders')
    .select(
      'id, order_number, status, payment_status, source_order_id, grand_total, currency, created_at, shipping_address, billing_address'
    )
    .eq('order_number', needle)
    .maybeSingle();

  if (error || !order) {
    console.log(JSON.stringify({ ok: false, error: error?.message ?? 'Order not found' }));
    process.exit(1);
  }

  if (order.source_order_id) {
    console.log(JSON.stringify({ ok: true, skipped: true, uniwareCode: order.source_order_id }));
    process.exit(0);
  }

  const { data: items } = await admin
    .from('order_items')
    .select('sku, quantity, unit_price, product_title, variant_title')
    .eq('order_id', order.id);

  if (!items?.length) {
    console.log(JSON.stringify({ ok: false, error: 'NO_ORDER_ITEMS' }));
    process.exit(1);
  }

  const ship = unicommerceShipTo(order.shipping_address);
  const bill = unicommerceShipTo(order.billing_address || order.shipping_address);
  const channel =
    process.argv[3]
    || process.env.UNICOMMERCE_CHANNEL_CODE
    || 'CUSTOM';
  const config = getUnicommerceConfig();
  const created = await soap(
    'CreateSaleOrderRequest',
    buildCreateSaleOrderSoapBody({
      id: order.id,
      displayCode: order.order_number,
      createdAt: order.created_at,
      currency: order.currency || 'INR',
      channelCode: channel,
      facilityCode: config.facilityCode,
      paymentAmount: Number(order.grand_total ?? 0),
      shippingAddress: {
        name: ship.name,
        addressLine1: ship.addressLine1,
        addressLine2: ship.addressLine2,
        city: ship.city,
        state: ship.state,
        country: ship.country,
        pincode: ship.pincode,
        phone: ship.phone,
        email: ship.email,
      },
      billingAddress: {
        name: bill.name,
        addressLine1: bill.addressLine1,
        addressLine2: bill.addressLine2,
        city: bill.city,
        state: bill.state,
        country: bill.country,
        pincode: bill.pincode,
        phone: bill.phone,
        email: bill.email,
      },
      items: items.map((item) => ({
        sku: String(item.sku || ''),
        price: Number(item.unit_price ?? 0),
        quantity: Number(item.quantity ?? 1),
      })),
    })
  );
  const errors: Array<{ code?: string; message?: string; description?: string }> = [];
  const errorTag = /<([^>:]+:)?Error\b([^>]*)\/?>/gi;
  let em;
  while ((em = errorTag.exec(created.xml))) {
    const attrs = em[2] || '';
    errors.push({
      code: attrs.match(/code="([^"]*)"/i)?.[1],
      message: attrs.match(/message="([^"]*)"/i)?.[1],
      description: attrs.match(/description="([^"]*)"/i)?.[1],
    });
  }
  const successful = tag(created.xml, 'Successful') === 'true';
  const errCode = errors[0]?.code ?? '';
  const errMsg =
    errors.map((e) => e.description || e.message).filter(Boolean).join('; ')
    || tag(created.xml, 'Message')
    || tag(created.xml, 'faultstring');
  const duplicate = /already exist|duplicate/i.test(`${errCode} ${errMsg}`);

  if (!successful && !duplicate) {
    console.log(
      JSON.stringify({
        ok: false,
        soapHost: created.soapHost,
        httpStatus: created.status,
        errorCode: errCode || null,
        errors: errors.slice(0, 5),
        error: (errMsg || 'CreateSaleOrder unsuccessful').slice(0, 240),
      })
    );
    process.exit(1);
  }

  const uniwareCode = order.id;
  await admin.from('orders').update({ source_order_id: uniwareCode }).eq('id', order.id);

  const got = await soap(
    'GetSaleOrderRequest',
    `<ser:GetSaleOrderRequest><ser:SaleOrder><ser:Code>${uniwareCode}</ser:Code></ser:SaleOrder></ser:GetSaleOrderRequest>`
  );
  const liveOk = tag(got.xml, 'Successful') === 'true' && Boolean(tag(got.xml, 'Code') || tag(got.xml, 'SaleOrder'));

  console.log(
    JSON.stringify({
      ok: true,
      orderNumber: order.order_number,
      uniwareCode,
      duplicate,
      soapHost: created.soapHost,
      verifiedInUniware: liveOk,
    })
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});

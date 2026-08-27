/**
 * READ-ONLY: CSV variant is_active + UniWare barcode presence for one SKU.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { buildUnicommerceSoapUrl, getUnicommerceConfig } from '../src/integrations/unicommerce/config';
import { xmlEscape } from '../src/integrations/unicommerce/sale-order-soap';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
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
  const csvSkus = fs
    .readFileSync(String.raw`c:\Users\pc\Downloads\Streetplayr product list.csv`, 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split(',')[1])
    .filter(Boolean);

  const { data: rows } = await admin
    .from('product_variants')
    .select('sku, is_active, compare_at_price, price')
    .in('sku', csvSkus);

  const inactive = (rows ?? []).filter((r) => r.is_active === false).map((r) => r.sku);
  const compare = [...new Set((rows ?? []).map((r) => r.compare_at_price))];

  const c = getUnicommerceConfig();
  const url = buildUnicommerceSoapUrl(c.apiUrl, c.facilityCode);
  const sku = 'PS-TEE-INS-PRP-M';
  const body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/">
  <soapenv:Header><wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><wsse:UsernameToken>
  <wsse:Username>${xmlEscape(c.username)}</wsse:Username>
  <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlEscape(c.password)}</wsse:Password>
  </wsse:UsernameToken></wsse:Security></soapenv:Header>
  <soapenv:Body><ser:GetItemTypeRequest><ser:SkuCode>${sku}</ser:SkuCode></ser:GetItemTypeRequest></soapenv:Body></soapenv:Envelope>`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'GetItemTypeRequest', Facility: c.facilityCode },
    body,
  });
  const xml = await res.text();
  const names = [...new Set([...xml.matchAll(/<\/?(?:[\w-]+:)?([A-Za-z][\w-]*)/g)].map((m) => m[1]))].filter((t) =>
    /ean|scan|isbn|gtin|barcode|identifier|code/i.test(t)
  );
  console.log(
    JSON.stringify({
      csvVariantRows: rows?.length ?? 0,
      inactive,
      compareAt: compare,
      csvEanInXml: xml.includes('8905570042165'),
      identifierTags: names,
    })
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

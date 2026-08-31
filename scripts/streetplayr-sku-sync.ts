/**
 * SKU-keyed UniWare → DB sync for the 62 CSV StreetPlayR SKUs.
 * Never rewrites sku. Never deletes. Missing UniWare snapshot = skip (last-known-good).
 * Usage: npx tsx scripts/streetplayr-sku-sync.ts
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  buildUnicommerceSoapUrl,
  getUnicommerceConfig,
} from '../src/integrations/unicommerce/config';
import { xmlEscape } from '../src/integrations/unicommerce/sale-order-soap';
import { isStreetPlayrUnicommerceBrand } from '../src/integrations/unicommerce/streetplayr-brand';
import { variantAttributesFromUniware } from '../src/integrations/unicommerce/variant-attributes';
import { normalizeSizeLabel, sizeFromSku } from '../lib/products/sizes';

const CSV_PATH = String.raw`c:\Users\pc\Downloads\Streetplayr product list.csv`;

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

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    if (row.some((x) => x.trim())) rows.push(row);
  }
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => {
      o[h] = (r[i] ?? '').trim();
    });
    return o;
  });
}

function tag(xml: string, name: string): string {
  const re = new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, 'i');
  return xml.match(re)?.[1]?.trim() ?? '';
}

function tagBlocks(xml: string, name: string): string[] {
  const re = new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
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
    signal: AbortSignal.timeout(45000),
  });
  const xml = await res.text();
  return { xml, successful: /<[^>]*Successful[^>]*>true<\/[^>]*Successful>/i.test(xml) };
}

async function main() {
  loadEnvLocal();
  const csvSkus = parseCsv(fs.readFileSync(CSV_PATH, 'utf8')).map((r) => r['Sku Code']).filter(Boolean);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let updated = 0;
  let skippedMissingUni = 0;
  let skippedMissingDb = 0;
  let skuRewritesBlocked = 0;
  const errors: string[] = [];
  const after: Array<{ sku: string; color: string; size: string; ean?: string; price: number }> = [];

  for (const sku of csvSkus) {
    let uni;
    try {
      const detail = await soap(
        'GetItemTypeRequest',
        `<ser:GetItemTypeRequest><ser:SkuCode>${xmlEscape(sku)}</ser:SkuCode></ser:GetItemTypeRequest>`
      );
      if (!detail.successful) {
        skippedMissingUni++;
        continue;
      }
      const uniSku = tag(detail.xml, 'SkuCode') || sku;
      if (uniSku !== sku) {
        skuRewritesBlocked++;
        errors.push(`SKU identity mismatch requested=${sku} uni=${uniSku}`);
        continue;
      }
      const brand = tag(detail.xml, 'Brand');
      if (!isStreetPlayrUnicommerceBrand(brand)) {
        skippedMissingUni++;
        errors.push(`${sku} brand=${brand || '(empty)'} not playR STREET`);
        continue;
      }
      uni = {
        sku: uniSku,
        color: tag(detail.xml, 'Color'),
        size: tag(detail.xml, 'Size') || sizeFromSku(sku),
        ean: tag(detail.xml, 'Ean') || tag(detail.xml, 'EAN'),
        mrp: Math.round(parseFloat(tag(detail.xml, 'MaxRetailPrice')) || 0),
        hsn: tag(detail.xml, 'HSNCode') || tag(detail.xml, 'HsnCode'),
        gstTaxTypeCode:
          tag(detail.xml, 'GstTaxTypeCode')
          || tag(detail.xml, 'GSTTaxTypeCode')
          || tag(detail.xml, 'TaxTypeCode'),
      };
    } catch (e) {
      skippedMissingUni++;
      errors.push(`${sku} GetItemType ${e instanceof Error ? e.message : 'fail'}`);
      continue;
    }

    const { data: variant, error: vErr } = await admin
      .from('product_variants')
      .select('id, sku, price, attributes')
      .eq('sku', sku)
      .maybeSingle();

    if (vErr || !variant) {
      skippedMissingDb++;
      errors.push(`${sku} DB variant missing`);
      continue;
    }
    if (variant.sku !== sku) {
      skuRewritesBlocked++;
      continue;
    }

    const attributes = variantAttributesFromUniware({
      sku,
      color: uni.color,
      size: uni.size,
      ean: uni.ean,
      hsn: uni.hsn,
      gstTaxTypeCode: uni.gstTaxTypeCode,
    });
    const { error: uErr } = await admin
      .from('product_variants')
      .update({
        title: attributes.size,
        price: uni.mrp || variant.price,
        attributes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variant.id)
      .eq('sku', sku);

    if (uErr) {
      errors.push(`${sku} update ${uErr.message}`);
      continue;
    }
    updated++;
    after.push({ sku, color: attributes.color, size: attributes.size, ean: attributes.ean, price: uni.mrp });
  }

  const snapshotMap = new Map<string, number>();
  let invFailed = 0;
  for (let i = 0; i < csvSkus.length; i += 50) {
    const chunk = csvSkus.slice(i, i + 50);
    try {
      const skusXml = chunk.map((s) => `<ser:ItemType><ser:ItemSKU>${xmlEscape(s)}</ser:ItemSKU></ser:ItemType>`).join('');
      const snap = await soap(
        'GetInventorySnapshotRequest',
        `<ser:GetInventorySnapshotRequest><ser:ItemTypes>${skusXml}</ser:ItemTypes></ser:GetInventorySnapshotRequest>`
      );
      for (const block of tagBlocks(snap.xml, 'InventorySnapshot')) {
        const itemSku = tag(block, 'ItemSKU') || tag(block, 'ItemTypeSKU');
        const raw = tag(block, 'Inventory');
        const n = parseInt(raw, 10);
        if (!itemSku || raw === '' || !Number.isFinite(n)) continue;
        snapshotMap.set(itemSku.toLowerCase(), n);
      }
    } catch {
      invFailed++;
    }
  }

  let invUpdated = 0;
  let invSkipped = 0;
  const { data: dbVars } = await admin.from('product_variants').select('id, sku').in('sku', csvSkus);
  for (const v of dbVars ?? []) {
    const stock = snapshotMap.get(String(v.sku).toLowerCase());
    if (stock == null) {
      invSkipped++;
      continue;
    }
    const { data: existing } = await admin
      .from('inventory')
      .select('id, quantity')
      .eq('variant_id', v.id)
      .maybeSingle();
    if (existing) {
      if (Number(existing.quantity) !== stock) {
        await admin.from('inventory').update({ quantity: stock, updated_at: new Date().toISOString() }).eq('id', existing.id);
      }
    } else {
      await admin.from('inventory').insert({
        variant_id: v.id,
        quantity: stock,
        reserved_quantity: 0,
        low_stock_threshold: 10,
        updated_at: new Date().toISOString(),
      });
    }
    invUpdated++;
  }

  const stillDefault = after.filter((r) => r.color === 'Default');
  const missingEan = after.filter((r) => !r.ean);
  const sizeWrong = after.filter((r) => r.size !== normalizeSizeLabel(sizeFromSku(r.sku)));

  console.log(
    JSON.stringify(
      {
        csvSkus: csvSkus.length,
        variantsUpdated: updated,
        skippedMissingUni,
        skippedMissingDb,
        skuRewritesBlocked,
        inventoryWritten: invUpdated,
        inventorySkippedNoSnapshot: invSkipped,
        inventoryFailedChunks: invFailed,
        colorDefaultLeft: stillDefault.map((r) => r.sku),
        eanMissing: missingEan.length,
        sizeMismatch: sizeWrong.map((r) => r.sku),
        errors,
        sample: after.slice(0, 3),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

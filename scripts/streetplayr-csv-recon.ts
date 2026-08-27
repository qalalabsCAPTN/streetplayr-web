/**
 * Read-only CSV ↔ UniWare ↔ DB recon (optional --write-inventory).
 * Never deletes. Never prints secrets, emails, phones, or addresses.
 * Usage:
 *   npx tsx scripts/streetplayr-csv-recon.ts
 *   npx tsx scripts/streetplayr-csv-recon.ts --write-inventory
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
import { launchEnvPresence } from '../lib/env/validate';
import { normalizeSizeLabel, sizeFromSku } from '../lib/products/sizes';

const CSV_PATH = String.raw`c:\Users\pc\Downloads\Streetplayr product list.csv`;
const WRITE_INV = process.argv.includes('--write-inventory');

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
  return { status: res.status, xml, soapHost: new URL(url).host, successful: /<[^>]*Successful[^>]*>true<\/[^>]*Successful>/i.test(xml) };
}

async function main() {
  loadEnvLocal();
  const presence = launchEnvPresence();
  console.log('CONFIG_PRESENCE', JSON.stringify({ ...presence.vars, easebuzzEnv: presence.easebuzzEnv }));

  const csvRows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  const csvSkus = csvRows.map((r) => r['Sku Code']).filter(Boolean);
  const csvDupes = csvSkus.filter((s, i) => csvSkus.indexOf(s) !== i);
  const csvBySku = new Map(csvRows.map((r) => [r['Sku Code'], r]));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Missing Supabase admin env' }));
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
  const { data: brand } = await admin.from('brands').select('id, slug').eq('slug', brandSlug).maybeSingle();
  if (!brand?.id) {
    console.log(JSON.stringify({ ok: false, error: 'streetplayr brand missing' }));
    process.exit(1);
  }

  const { data: products } = await admin
    .from('products')
    .select('id, title, slug, status, metadata, brand_id')
    .eq('brand_id', brand.id);

  const productIds = (products ?? []).map((p) => p.id);
  const { data: variants } = await admin
    .from('product_variants')
    .select('id, sku, title, price, attributes, product_id')
    .in('product_id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);

  const variantIds = (variants ?? []).map((v) => v.id);
  const { data: invRows } = await admin
    .from('inventory')
    .select('variant_id, quantity, reserved_quantity')
    .in('variant_id', variantIds.length ? variantIds : ['00000000-0000-0000-0000-000000000000']);
  const invByVariant = new Map(
    (invRows ?? []).map((r) => [
      r.variant_id,
      { qty: Number(r.quantity ?? 0), reserved: Number(r.reserved_quantity ?? 0) },
    ])
  );

  const dbBySku = new Map<string, (typeof variants)[number]>();
  const dbDupes: string[] = [];
  for (const v of variants ?? []) {
    const sku = String(v.sku || '');
    if (!sku) continue;
    if (dbBySku.has(sku.toLowerCase())) dbDupes.push(sku);
    dbBySku.set(sku.toLowerCase(), v);
  }

  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  let searchAuthOk = false;
  let searchPages = 0;
  const uniBySku = new Map<
    string,
    { sku: string; name: string; brand: string; size: string; color: string; enabled: string }
  >();
  let start = 0;
  try {
    while (searchPages < 40) {
      const page = await soap(
        'SearchItemTypesRequest',
        `<ser:SearchItemTypesRequest>
          <ser:SearchOptions>
            <ser:DisplayStart>${start}</ser:DisplayStart>
            <ser:DisplayLength>100</ser:DisplayLength>
          </ser:SearchOptions>
        </ser:SearchItemTypesRequest>`
      );
      searchAuthOk = searchAuthOk || page.successful;
      const items = tagBlocks(page.xml, 'ItemType');
      if (!page.successful || items.length === 0) break;
      searchPages++;
      for (const block of items) {
        const sku = tag(block, 'SKUCode') || tag(block, 'SkuCode');
        if (!sku) continue;
        uniBySku.set(sku.toLowerCase(), {
          sku,
          name: tag(block, 'Name'),
          brand: tag(block, 'Brand'),
          size: tag(block, 'Size'),
          color: tag(block, 'Color'),
          enabled: tag(block, 'Enabled'),
        });
      }
      if (items.length < 100) break;
      start += 100;
    }
  } catch (e) {
    console.log('SEARCH_FAIL', e instanceof Error ? e.message : 'error');
  }

  const streetplayrUni = [...uniBySku.values()].filter((it) => isStreetPlayrUnicommerceBrand(it.brand));

  const uniMissing: string[] = [];
  const brandMismatch: string[] = [];
  const sizeMismatches: string[] = [];
  const colorMismatches: string[] = [];
  const dbMissing: string[] = [];

  for (const sku of csvSkus) {
    let hit = uniBySku.get(sku.toLowerCase());
    if (!hit) {
      try {
        const detail = await soap(
          'GetItemTypeRequest',
          `<ser:GetItemTypeRequest><ser:SkuCode>${xmlEscape(sku)}</ser:SkuCode></ser:GetItemTypeRequest>`
        );
        if (detail.successful && tag(detail.xml, 'SkuCode')) {
          hit = {
            sku: tag(detail.xml, 'SkuCode') || sku,
            name: tag(detail.xml, 'Name'),
            brand: tag(detail.xml, 'Brand'),
            size: tag(detail.xml, 'Size'),
            color: tag(detail.xml, 'Color'),
            enabled: tag(detail.xml, 'Enabled'),
          };
          uniBySku.set(sku.toLowerCase(), hit);
          if (isStreetPlayrUnicommerceBrand(hit.brand)) streetplayrUni.push(hit);
        }
      } catch {
        /* missing */
      }
    }
    const csv = csvBySku.get(sku)!;
    if (!hit) {
      uniMissing.push(sku);
      continue;
    }
    if (!isStreetPlayrUnicommerceBrand(hit.brand)) brandMismatch.push(`${sku}:${hit.brand || '(empty)'}`);
    const csvSize = normalizeSizeLabel(csv.Size || sizeFromSku(sku));
    const uniSize = normalizeSizeLabel(hit.size || sizeFromSku(hit.sku));
    if (csvSize && uniSize && csvSize !== uniSize) sizeMismatches.push(`${sku} csv=${csvSize} uni=${uniSize}`);
    const db = dbBySku.get(sku.toLowerCase());
    if (!db) dbMissing.push(sku);
    else {
      const dbSize = normalizeSizeLabel(
        ((db.attributes as { size?: string } | null)?.size || db.title || sizeFromSku(String(db.sku))) as string
      );
      if (csvSize && dbSize && csvSize !== dbSize) sizeMismatches.push(`${sku} csv=${csvSize} db=${dbSize}`);
    }
    const csvColor = (csv.Color || '').trim().toLowerCase();
    const uniColor = (hit.color || '').trim().toLowerCase();
    if (csvColor && uniColor && csvColor !== uniColor) {
      colorMismatches.push(`${sku} csv=${csv.Color} uni=${hit.color}`);
    }
  }

  const csvSet = new Set(csvSkus.map((s) => s.toLowerCase()));
  const unexpected = streetplayrUni.filter((it) => !csvSet.has(it.sku.toLowerCase())).map((it) => it.sku);
  const matched = csvSkus.filter((s) => uniBySku.has(s.toLowerCase()) && isStreetPlayrUnicommerceBrand(uniBySku.get(s.toLowerCase())!.brand));

  const sizesByParent = new Map<string, string[]>();
  for (const sku of csvSkus) {
    const last = sku.lastIndexOf('-');
    const parent = last > 0 ? sku.slice(0, last) : sku;
    const size = normalizeSizeLabel(csvBySku.get(sku)?.Size || sizeFromSku(sku));
    const list = sizesByParent.get(parent) ?? [];
    if (size && !list.includes(size)) list.push(size);
    sizesByParent.set(parent, list);
  }

  const snapshotMap = new Map<string, number>();
  let invFailedChunks = 0;
  let invEmptyChunks = 0;
  const skuChunks: string[][] = [];
  for (let i = 0; i < csvSkus.length; i += 50) skuChunks.push(csvSkus.slice(i, i + 50));
  for (const chunk of skuChunks) {
    try {
      const skusXml = chunk.map((sku) => `<ser:ItemType><ser:ItemSKU>${xmlEscape(sku)}</ser:ItemSKU></ser:ItemType>`).join('');
      const snap = await soap(
        'GetInventorySnapshotRequest',
        `<ser:GetInventorySnapshotRequest><ser:ItemTypes>${skusXml}</ser:ItemTypes></ser:GetInventorySnapshotRequest>`
      );
      const blocks = tagBlocks(snap.xml, 'InventorySnapshot');
      if (!snap.successful || blocks.length === 0) {
        invEmptyChunks++;
        continue;
      }
      for (const block of blocks) {
        const sku = tag(block, 'ItemSKU') || tag(block, 'ItemTypeSKU');
        const raw = tag(block, 'Inventory');
        const n = parseInt(raw, 10);
        if (!sku || raw === '' || !Number.isFinite(n)) continue;
        snapshotMap.set(sku.toLowerCase(), n);
      }
    } catch {
      invFailedChunks++;
    }
  }

  let positive = 0;
  let zero = 0;
  let missingSnapshot = 0;
  for (const sku of csvSkus) {
    if (!snapshotMap.has(sku.toLowerCase())) missingSnapshot++;
    else if (snapshotMap.get(sku.toLowerCase()) === 0) zero++;
    else positive++;
  }

  let invWritten = 0;
  let invSkipped = 0;
  let invWriteErrors = 0;
  if (WRITE_INV) {
    const streetplayrVariants = (variants ?? []).filter((v) => csvSet.has(String(v.sku || '').toLowerCase()));
    for (const v of streetplayrVariants) {
      const skuLower = String(v.sku || '').toLowerCase();
      if (!snapshotMap.has(skuLower)) {
        invSkipped++;
        continue;
      }
      const stock = Math.max(0, snapshotMap.get(skuLower)!);
      const existing = invByVariant.get(v.id);
      try {
        if (existing) {
          if (existing.qty === stock) {
            invWritten++;
            continue;
          }
          const { error } = await admin
            .from('inventory')
            .update({ quantity: stock, updated_at: new Date().toISOString() })
            .eq('variant_id', v.id);
          if (error) throw error;
        } else {
          const { error } = await admin.from('inventory').insert({
            variant_id: v.id,
            quantity: stock,
            reserved_quantity: 0,
            low_stock_threshold: 10,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        }
        invWritten++;
      } catch {
        invWriteErrors++;
      }
    }
  }

  const dbExtra = [...dbBySku.keys()].filter((s) => !csvSet.has(s));

  console.log(
    JSON.stringify(
      {
        soapHost: (() => {
          try {
            return new URL(buildUnicommerceSoapUrl(getUnicommerceConfig().apiUrl, getUnicommerceConfig().facilityCode)).host;
          } catch {
            return 'INVALID';
          }
        })(),
        channel: process.env.UNICOMMERCE_CHANNEL_CODE || 'MISSING',
        searchAuthOk,
        searchPages,
        csvSkus: csvSkus.length,
        csvDupes: [...new Set(csvDupes)],
        uniMatchedPlayRStreet: matched.length,
        uniMissing,
        uniUnexpectedPlayRStreet: unexpected,
        uniBrandMismatch: brandMismatch,
        dbDupes: [...new Set(dbDupes)],
        dbMissingCsvSkus: dbMissing,
        dbExtraSkusNotInCsv: dbExtra,
        sizeMismatches,
        colorMismatches: colorMismatches.slice(0, 20),
        colorMismatchCount: colorMismatches.length,
        sizesByParent: Object.fromEntries([...sizesByParent.entries()].map(([k, v]) => [k, v.join(' ')])),
        inventory: {
          positive,
          zero,
          missingSnapshot,
          failedChunks: invFailedChunks,
          emptyChunks: invEmptyChunks,
          snapshotCount: snapshotMap.size,
          write: WRITE_INV
            ? { written: invWritten, skippedNoSnapshot: invSkipped, errors: invWriteErrors }
            : 'skipped',
        },
        dbProducts: (products ?? []).map((p) => ({ slug: p.slug, status: p.status, title: p.title })),
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

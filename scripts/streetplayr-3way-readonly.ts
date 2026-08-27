/**
 * READ-ONLY 3-way recon: CSV ↔ Supabase ↔ UniCommerce.
 * Never writes. Never prints secrets, emails, phones, addresses.
 * Usage: npx tsx scripts/streetplayr-3way-readonly.ts
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  buildUnicommerceSoapUrl,
  getUnicommerceConfig,
} from '../src/integrations/unicommerce/config';
import { xmlEscape } from '../src/integrations/unicommerce/sale-order-soap';
import { isStreetPlayrUnicommerceBrand, isStreetPlayrCatalogMetadata } from '../src/integrations/unicommerce/streetplayr-brand';
import { normalizeSizeLabel, sizeFromSku } from '../lib/products/sizes';

const CSV_PATH = String.raw`c:\Users\pc\Downloads\Streetplayr product list.csv`;
const LEGACY_SLUGS = ['urban-hoodie', 'signature-cap', 'limited-edition-tee', 'stick-no-bills'];

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

function parentFromSku(sku: string): string {
  const last = sku.lastIndexOf('-');
  return last > 0 ? sku.slice(0, last) : sku;
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
    signal: AbortSignal.timeout(45000),
  });
  const xml = await res.text();
  return { xml, successful: /<[^>]*Successful[^>]*>true<\/[^>]*Successful>/i.test(xml) };
}

function canReachStorefront(p: {
  status: string;
  slug: string;
  metadata: unknown;
  featured_image_url: string | null;
  variantCount: number;
}): { catalog: boolean; pdp: boolean; reason: string[] } {
  const reason: string[] = [];
  const meta = (p.metadata && typeof p.metadata === 'object' ? p.metadata : {}) as Record<string, unknown>;
  if (p.status !== 'active') reason.push('status!=active');
  if (meta.draft === true || meta.placeholder === true) reason.push('metadata.draft/placeholder');
  if (!p.slug?.trim()) reason.push('empty slug');
  const featured = p.featured_image_url || '';
  if (!featured || featured.includes('null')) reason.push('no featured image');
  const gallery = meta.gallery_images;
  if (!Array.isArray(gallery) || gallery.length === 0) reason.push('no gallery_images');
  if (!isStreetPlayrCatalogMetadata(p.metadata)) reason.push('metadata.brand not StreetPlayR');
  if (p.variantCount === 0) reason.push('no variants');
  const ok = reason.length === 0;
  return { catalog: ok, pdp: ok, reason };
}

async function main() {
  loadEnvLocal();
  const csvRows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  const csvSkus = csvRows.map((r) => r['Sku Code']).filter(Boolean);
  const csvBySku = new Map(csvRows.map((r) => [r['Sku Code'], r]));
  const csvParents = [...new Set(csvSkus.map(parentFromSku))];
  const csvSet = new Set(csvSkus.map((s) => s.toLowerCase()));

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: brands } = await admin.from('brands').select('id, slug, name');
  const brandById = new Map((brands ?? []).map((b) => [b.id, b]));
  const streetplayrBrand = (brands ?? []).find((b) => b.slug === (process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr'));

  const { data: allProducts } = await admin
    .from('products')
    .select('id, title, slug, status, brand_id, metadata, featured_image_url');

  const { data: sampleVariant } = await admin.from('product_variants').select('*').limit(1);
  const variantColumns = sampleVariant?.[0] ? Object.keys(sampleVariant[0]) : [];
  const { data: sampleInv } = await admin.from('inventory').select('*').limit(1);
  const inventoryColumns = sampleInv?.[0] ? Object.keys(sampleInv[0]) : [];

  const variantSelect = variantColumns.includes('barcode')
    ? 'id, sku, title, price, attributes, product_id, barcode'
    : 'id, sku, title, price, attributes, product_id';
  const { data: allVariants } = await admin.from('product_variants').select(variantSelect);

  const { data: allInv } = await admin.from('inventory').select('id, variant_id, quantity, reserved_quantity');

  const productById = new Map((allProducts ?? []).map((p) => [p.id, p]));
  const variants = allVariants ?? [];
  const invByVariant = new Map(
    (allInv ?? []).map((r) => [
      r.variant_id,
      { qty: Number(r.quantity ?? 0), reserved: Number(r.reserved_quantity ?? 0), id: r.id },
    ])
  );

  const dbBySkuExact = new Map<string, typeof variants>();
  const dbBySkuLower = new Map<string, typeof variants>();
  for (const v of variants) {
    const sku = String((v as { sku?: string }).sku || '');
    if (!sku) continue;
    const exact = dbBySkuExact.get(sku) ?? [];
    exact.push(v);
    dbBySkuExact.set(sku, exact);
    const lower = dbBySkuLower.get(sku.toLowerCase()) ?? [];
    lower.push(v);
    dbBySkuLower.set(sku.toLowerCase(), lower);
  }

  const uniBySku = new Map<
    string,
    {
      sku: string;
      name: string;
      brand: string;
      size: string;
      color: string;
      ean: string;
      mrp: number;
      enabled: string;
    }
  >();

  for (const sku of csvSkus) {
    const detail = await soap(
      'GetItemTypeRequest',
      `<ser:GetItemTypeRequest><ser:SkuCode>${xmlEscape(sku)}</ser:SkuCode></ser:GetItemTypeRequest>`
    );
    if (!detail.successful) continue;
    uniBySku.set(sku.toLowerCase(), {
      sku: tag(detail.xml, 'SkuCode') || sku,
      name: tag(detail.xml, 'Name'),
      brand: tag(detail.xml, 'Brand'),
      size: tag(detail.xml, 'Size'),
      color: tag(detail.xml, 'Color'),
      ean: tag(detail.xml, 'ScanIdentifier') || tag(detail.xml, 'EAN') || tag(detail.xml, 'Isbn') || '',
      mrp: parseFloat(tag(detail.xml, 'MaxRetailPrice')) || 0,
      enabled: tag(detail.xml, 'Enabled'),
    });
  }

  const uniParents = [...new Set([...uniBySku.values()].map((u) => parentFromSku(u.sku)))];

  const streetplayrProducts = (allProducts ?? []).filter((p) => p.brand_id === streetplayrBrand?.id);
  const activeStreetplayr = streetplayrProducts.filter((p) => p.status === 'active');
  const csvDbParents = streetplayrProducts.filter((p) => csvParents.includes(p.slug));
  const extraDbParents = streetplayrProducts.filter((p) => !csvParents.includes(p.slug));

  const missingDbSkus = csvSkus.filter((s) => !dbBySkuLower.has(s.toLowerCase()));
  const missingUniSkus = csvSkus.filter((s) => !uniBySku.has(s.toLowerCase()));
  const csvMatched = csvSkus.filter((s) => dbBySkuLower.has(s.toLowerCase()) && uniBySku.has(s.toLowerCase()));

  const unexpectedDbSkus: string[] = [];
  for (const [lower, rows] of dbBySkuLower) {
    if (csvSet.has(lower)) continue;
    const parent = productById.get((rows[0] as { product_id: string }).product_id);
    if (parent?.brand_id === streetplayrBrand?.id) unexpectedDbSkus.push((rows[0] as { sku: string }).sku);
  }

  const duplicateSkus = [...dbBySkuLower.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([sku, rows]) => ({
      sku,
      count: rows.length,
      ids: rows.map((r) => (r as { id: string }).id),
      productIds: [...new Set(rows.map((r) => (r as { product_id: string }).product_id))],
    }));

  const eanByValue = new Map<string, string[]>();
  for (const row of csvRows) {
    const ean = row.EAN;
    if (!ean) continue;
    const list = eanByValue.get(ean) ?? [];
    list.push(row['Sku Code']);
    eanByValue.set(ean, list);
  }
  const duplicateCsvEan = [...eanByValue.entries()].filter(([, skus]) => skus.length > 1);

  const wrongParent: string[] = [];
  const wrongSize: string[] = [];
  const wrongColor: string[] = [];
  const wrongEan: string[] = [];
  const wrongBrandMeta: string[] = [];
  const priceVsMrp: string[] = [];
  const missingInv: string[] = [];
  const variantExists: string[] = [];

  for (const sku of csvSkus) {
    const csv = csvBySku.get(sku)!;
    const dbRows = dbBySkuLower.get(sku.toLowerCase()) ?? [];
    const uni = uniBySku.get(sku.toLowerCase());
    const expectedParent = parentFromSku(sku);
    const csvSize = normalizeSizeLabel(csv.Size || sizeFromSku(sku));
    const csvEan = csv.EAN || '';
    const csvMrp = Number(csv.MRP);

    if (!dbRows.length) continue;
    variantExists.push(sku);
    const v = dbRows[0] as {
      id: string;
      sku: string;
      title: string;
      price: number;
      attributes: { size?: string; color?: string } | null;
      product_id: string;
      barcode?: string;
    };
    const prod = productById.get(v.product_id);
    if (prod && prod.slug !== expectedParent) {
      wrongParent.push(`${sku} expected=${expectedParent} got=${prod.slug}`);
    }
    const dbSize = normalizeSizeLabel(v.attributes?.size || v.title || sizeFromSku(v.sku));
    if (csvSize && dbSize && csvSize !== dbSize) wrongSize.push(`${sku} csv=${csvSize} db=${dbSize}`);
    if (uni) {
      const uniSize = normalizeSizeLabel(uni.size || sizeFromSku(uni.sku));
      if (csvSize && uniSize && csvSize !== uniSize) wrongSize.push(`${sku} csv=${csvSize} uni=${uniSize}`);
    }
    const dbColor = (v.attributes?.color || '').trim();
    const csvColor = (csv.Color || '').trim();
    if (csvColor && dbColor && dbColor.toLowerCase() !== csvColor.toLowerCase()) {
      wrongColor.push(`${sku} csv=${csvColor} db=${dbColor}`);
    }
    if (csvEan && uni?.ean && csvEan !== uni.ean) wrongEan.push(`${sku} csv=${csvEan} uni=${uni.ean}`);
    const dbEan = v.barcode || '';
    if (csvEan && dbEan && csvEan !== dbEan) wrongEan.push(`${sku} csv=${csvEan} db=${dbEan}`);
    if (prod && !isStreetPlayrCatalogMetadata(prod.metadata)) {
      wrongBrandMeta.push(`${sku} product=${prod.slug}`);
    }
    if (Number.isFinite(csvMrp) && Number(v.price) !== csvMrp) {
      priceVsMrp.push(`${sku} csvMrp=${csvMrp} dbPrice=${v.price}`);
    }
    if (!invByVariant.has(v.id)) missingInv.push(sku);
  }

  const wrongBrandProducts = (allProducts ?? []).filter((p) => {
    if (p.brand_id !== streetplayrBrand?.id) return false;
    return !isStreetPlayrCatalogMetadata(p.metadata);
  });

  const foreignBrandStreetplayrSlug = (allProducts ?? []).filter((p) => {
    const b = brandById.get(p.brand_id);
    return csvParents.includes(p.slug) && b?.slug !== 'streetplayr';
  });

  const orphanVariants = variants.filter((v) => !productById.has((v as { product_id: string }).product_id));
  const variantIdSet = new Set(variants.map((v) => (v as { id: string }).id));
  const orphanInventory = (allInv ?? []).filter((r) => !variantIdSet.has(r.variant_id));

  const csvVariantRows = variants.filter((v) => csvSet.has(String((v as { sku?: string }).sku || '').toLowerCase()));
  const foreignVariantUnderCsvParent = csvVariantRows.filter((v) => {
    const prod = productById.get((v as { product_id: string }).product_id);
    const b = prod ? brandById.get(prod.brand_id) : null;
    return b?.slug !== 'streetplayr';
  });

  const streetplayrNonCsvVariants = variants.filter((v) => {
    const sku = String((v as { sku?: string }).sku || '');
    if (csvSet.has(sku.toLowerCase())) return false;
    const prod = productById.get((v as { product_id: string }).product_id);
    return prod?.brand_id === streetplayrBrand?.id;
  });

  const legacyReport = [];
  for (const slug of LEGACY_SLUGS) {
    const p = (allProducts ?? []).find((x) => x.slug === slug);
    if (!p) {
      legacyReport.push({ slug, exists: false });
      continue;
    }
    const pVars = variants.filter((v) => (v as { product_id: string }).product_id === p.id);
    const pInv = pVars.filter((v) => invByVariant.has((v as { id: string }).id)).length;
    const reach = canReachStorefront({
      status: p.status,
      slug: p.slug,
      metadata: p.metadata,
      featured_image_url: p.featured_image_url,
      variantCount: pVars.length,
    });
    const brand = brandById.get(p.brand_id);
    legacyReport.push({
      slug,
      exists: true,
      id: p.id,
      status: p.status,
      brandSlug: brand?.slug,
      metadataBrand: (p.metadata as { brand?: string } | null)?.brand ?? null,
      variantCount: pVars.length,
      inventoryRows: pInv,
      skus: pVars.map((v) => (v as { sku: string }).sku),
      storefront: reach,
      pdpQueryWouldMatch: p.status === 'active' && brand?.slug === 'streetplayr',
    });
  }

  const activeCsvParents = csvDbParents.filter((p) => p.status === 'active');
  const invForCsv = csvMatched.map((sku) => {
    const rows = dbBySkuLower.get(sku.toLowerCase()) ?? [];
    const v = rows[0] as { id: string } | undefined;
    if (!v) return { sku, variant: false, inventory: false, qty: null, reserved: null, available: null };
    const inv = invByVariant.get(v.id);
    return {
      sku,
      variant: true,
      inventory: Boolean(inv),
      qty: inv?.qty ?? null,
      reserved: inv?.reserved ?? null,
      available: inv ? Math.max(0, inv.qty - inv.reserved) : null,
    };
  });

  const skuIntegrity = invForCsv.reduce(
    (acc, row) => {
      if (row.variant) acc.variantExists++;
      if (row.inventory) acc.inventoryExists++;
      if (row.qty != null && row.qty > 0) acc.positive++;
      if (row.qty === 0) acc.zero++;
      if (row.variant && !row.inventory) acc.missingInv++;
      return acc;
    },
    { variantExists: 0, inventoryExists: 0, positive: 0, zero: 0, missingInv: 0 }
  );

  console.log(
    JSON.stringify(
      {
        variantColumns,
        inventoryColumns,
        csvParents,
        csvParentCount: csvParents.length,
        csvSkuCount: csvSkus.length,
        uniParentCount: uniParents.length,
        uniSkuCount: uniBySku.size,
        uniParents,
        dbStreetplayrProductCount: streetplayrProducts.length,
        dbActiveStreetplayr: activeStreetplayr.map((p) => p.slug),
        dbCsvParents: csvDbParents.map((p) => ({ slug: p.slug, status: p.status, title: p.title })),
        extraDbParents: extraDbParents.map((p) => ({ slug: p.slug, status: p.status })),
        missingDbSkus,
        missingUniSkus,
        exactMatches: csvMatched.length,
        unexpectedDbSkusCount: unexpectedDbSkus.length,
        unexpectedDbSkusSample: unexpectedDbSkus.slice(0, 80),
        duplicateSkus,
        duplicateCsvEan,
        wrongParent,
        wrongSize,
        wrongColorCount: wrongColor.length,
        wrongColorSample: wrongColor.slice(0, 8),
        wrongEan,
        eanStoredInDb: variantColumns.includes('barcode') || variantColumns.includes('ean'),
        wrongBrandMeta,
        wrongBrandProducts: wrongBrandProducts.map((p) => ({
          slug: p.slug,
          status: p.status,
          metadataBrand: (p.metadata as { brand?: string } | null)?.brand ?? null,
        })),
        foreignBrandStreetplayrSlug,
        foreignVariantUnderCsvParent: foreignVariantUnderCsvParent.length,
        orphanVariants: orphanVariants.map((v) => (v as { id: string; sku: string }).sku),
        orphanInventory: orphanInventory.map((r) => r.variant_id),
        priceVsMrpCount: priceVsMrp.length,
        priceVsMrpSample: priceVsMrp.slice(0, 12),
        skuIntegrity,
        missingInv,
        streetplayrNonCsvVariantCount: streetplayrNonCsvVariants.length,
        activeCsvParentCount: activeCsvParents.length,
        csvSkuOnActiveParents: variants.filter((v) => {
          const prod = productById.get((v as { product_id: string }).product_id);
          return prod?.status === 'active' && csvSet.has(String((v as { sku?: string }).sku || '').toLowerCase());
        }).length,
        uniSample: [...uniBySku.values()].slice(0, 2),
        legacyReport,
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

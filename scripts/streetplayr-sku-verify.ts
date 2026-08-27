/**
 * READ-ONLY post-sync check: CSV SKUs in DB vs expected UniWare fields.
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
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
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

async function main() {
  loadEnvLocal();
  const csv = parseCsv(fs.readFileSync(String.raw`c:\Users\pc\Downloads\Streetplayr product list.csv`, 'utf8'));
  const skus = csv.map((r) => r['Sku Code']);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: variants } = await admin
    .from('product_variants')
    .select('id, sku, title, price, attributes')
    .in('sku', skus);

  const bySku = new Map((variants ?? []).map((v) => [v.sku, v]));
  let colorMismatch = 0;
  let eanMismatch = 0;
  let sizeMismatch = 0;
  let priceMismatch = 0;
  let skuChanged = 0;
  const samples: string[] = [];
  for (const row of csv) {
    const sku = row['Sku Code'];
    const v = bySku.get(sku);
    if (!v) {
      samples.push(`missing ${sku}`);
      continue;
    }
    if (v.sku !== sku) skuChanged++;
    const attrs = (v.attributes || {}) as { color?: string; size?: string; ean?: string };
    if ((attrs.color || '') !== row.Color) {
      colorMismatch++;
      if (samples.length < 5) samples.push(`${sku} color db=${attrs.color} csv=${row.Color}`);
    }
    if ((attrs.ean || '') !== row.EAN) eanMismatch++;
    if ((attrs.size || v.title) !== row.Size) sizeMismatch++;
    if (Number(v.price) !== Number(row.MRP)) priceMismatch++;
  }

  const ids = (variants ?? []).map((v) => v.id);
  const { data: inv } = await admin.from('inventory').select('variant_id, quantity').in('variant_id', ids);
  console.log(
    JSON.stringify({
      dbRows: variants?.length,
      skuChanged,
      colorMismatch,
      eanMismatch,
      sizeMismatch,
      priceMismatch,
      inventoryRows: inv?.length,
      samples,
      inspired: bySku.get('PS-TEE-INS-PRP-M'),
    })
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

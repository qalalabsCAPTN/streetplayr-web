import { createAdminClient } from '@/lib/supabase/admin';

export type ApplySkuQuantitiesResult = {
  written: number;
  matched: number;
  changedSlugs: string[];
  failed: Array<{ sku: string; message: string }>;
};

const SIZE_VARIANT = /^(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL)$/i;

function uniqueSkus(skus: Array<string | undefined | null>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of skus) {
    const sku = String(raw ?? '').trim();
    if (!sku) continue;
    const key = sku.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sku);
  }
  return out;
}

/** Uniware channel push fields → candidate SKUs (full SKU first). */
export function skuCandidatesFromUniwareItem(item: Record<string, unknown>): string[] {
  const productId = String(item.productId ?? item.itemSKU ?? item.sku ?? item.itemTypeSKU ?? '').trim();
  const variantId = String(item.variantId ?? '').trim();
  const candidates = [item.itemSKU, item.sku, item.itemTypeSKU, item.variantId, item.productId].map(
    (v) => String(v ?? '').trim()
  );
  if (productId && variantId && SIZE_VARIANT.test(variantId)) {
    candidates.unshift(`${productId}-${variantId}`);
  }
  return uniqueSkus(candidates);
}

export type SkuQuantityUpdate = { sku: string; quantity: number; candidates?: string[] };

export function parseUniwareInventoryPush(body: unknown): SkuQuantityUpdate[] {
  if (!body || typeof body !== 'object') return [];
  const rec = body as Record<string, unknown>;
  const list = rec.inventoryList ?? rec.payload;
  if (!Array.isArray(list)) return [];
  const updates: SkuQuantityUpdate[] = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    const candidates = skuCandidatesFromUniwareItem(item);
    const raw = item.inventory ?? item.stock ?? item.quantity;
    const quantity = Math.max(0, Number(raw));
    if (!candidates.length || !Number.isFinite(quantity)) continue;
    updates.push({ sku: candidates[0], quantity, candidates });
  }
  return updates;
}

export async function applySkuQuantities(
  updates: SkuQuantityUpdate[]
): Promise<ApplySkuQuantitiesResult> {
  const failed: ApplySkuQuantitiesResult['failed'] = [];
  const changedSlugs = new Set<string>();
  let written = 0;
  let matched = 0;
  if (updates.length === 0) {
    return { written: 0, matched: 0, changedSlugs: [], failed: [] };
  }

  const admin = createAdminClient();
  const wanted = uniqueSkus(updates.map((u) => u.sku));
  const { data: variants, error } = await admin
    .from('product_variants')
    .select('id, sku, product_id, products(slug)')
    .not('sku', 'is', null);

  if (error) {
    return {
      written: 0,
      matched: 0,
      changedSlugs: [],
      failed: wanted.map((sku) => ({ sku, message: error.message })),
    };
  }

  const bySku = new Map<string, { id: string; product_id: string; slug: string }>();
  for (const row of variants ?? []) {
    const sku = String(row.sku ?? '').trim();
    if (!sku) continue;
    const prod = row.products as { slug?: string } | { slug?: string }[] | null;
    const slug = Array.isArray(prod) ? prod[0]?.slug ?? '' : prod?.slug ?? '';
    bySku.set(sku.toLowerCase(), { id: row.id, product_id: row.product_id, slug });
  }

  const latestBySku = new Map<string, number>();
  for (const update of updates) {
    const keys = uniqueSkus([update.sku, ...(update.candidates ?? [])]);
    const hit = keys.find((sku) => bySku.has(sku.toLowerCase()));
    if (!hit) {
      failed.push({ sku: update.sku, message: 'SKU_NOT_FOUND' });
      continue;
    }
    latestBySku.set(hit.toLowerCase(), update.quantity);
  }

  for (const [skuLower, quantity] of latestBySku) {
    const variant = bySku.get(skuLower);
    if (!variant) {
      failed.push({ sku: skuLower, message: 'SKU_NOT_FOUND' });
      continue;
    }
    matched++;
    const { data: existingInv, error: checkError } = await admin
      .from('inventory')
      .select('id, quantity')
      .eq('variant_id', variant.id)
      .maybeSingle();
    if (checkError) {
      failed.push({ sku: skuLower, message: checkError.message });
      continue;
    }
    if (existingInv && Number(existingInv.quantity) === quantity) {
      continue;
    }
    if (existingInv) {
      const { error: updateError } = await admin
        .from('inventory')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', existingInv.id);
      if (updateError) {
        failed.push({ sku: skuLower, message: updateError.message });
        continue;
      }
    } else {
      const { error: insertError } = await admin.from('inventory').insert({
        variant_id: variant.id,
        quantity,
        reserved_quantity: 0,
        low_stock_threshold: 10,
        updated_at: new Date().toISOString(),
      });
      if (insertError) {
        failed.push({ sku: skuLower, message: insertError.message });
        continue;
      }
    }
    written++;
    if (variant.slug) changedSlugs.add(variant.slug);
  }

  return { written, matched, changedSlugs: [...changedSlugs], failed };
}

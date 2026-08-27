/**
 * StreetPlayR isolation at the UniCommerce catalog boundary.
 *
 * Live SOAP field: <Brand> (GetItemType / SearchItemTypes), mapped to itemTypeDTO.brand.
 * Live StreetPlayR value in UniCommerce (probed 2026-08-27): "playR STREET"
 *
 * Not StreetPlayR:
 *   "playR", "playR x …", "Adidas", "Adidas x …", empty
 *
 * Storefront DB already uses products.brand_id → brands.slug = streetplayr.
 * This module is the UniCommerce-side matcher plus a metadata backstop.
 */

export const UNICOMMERCE_BRAND_XML_TAG = 'Brand';

/** Exact live UniCommerce brand string for the StreetPlayR catalog. */
export const UNICOMMERCE_STREETPLAYR_BRAND = 'playR STREET';

function normalizeBrand(raw?: string | null): string {
  return (raw || '')
    .replace(/[®™]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * True only for the StreetPlayR UniCommerce brand.
 * Accepts the live value plus the public name "StreetPlayR" if UniCommerce is renamed.
 */
export function isStreetPlayrUnicommerceBrand(raw?: string | null): boolean {
  const n = normalizeBrand(raw);
  if (!n) return false;
  if (n === 'playr street') return true;
  if (n === 'streetplayr' || n === 'street playr') return true;
  return false;
}

export function filterStreetPlayrUnicommerceItems<T extends { brand?: string }>(
  items: T[]
): { kept: T[]; skipped: number } {
  const kept: T[] = [];
  let skipped = 0;
  for (const item of items) {
    if (isStreetPlayrUnicommerceBrand(item.brand)) kept.push(item);
    else skipped++;
  }
  return { kept, skipped };
}

/** Second storefront boundary: metadata.brand when present. Missing brand defers to brand_id. */
export function isStreetPlayrCatalogMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return true;
  const brand = (metadata as { brand?: unknown }).brand;
  if (typeof brand !== 'string' || brand.trim() === '') return true;
  return isStreetPlayrUnicommerceBrand(brand);
}

export function filterStreetPlayrCatalogProducts<T extends { metadata?: unknown }>(
  products: T[]
): T[] {
  return products.filter((p) => isStreetPlayrCatalogMetadata(p.metadata));
}

/** Cart/checkout: both brand_id and metadata.brand must belong to StreetPlayR. */
export function isStreetPlayrStorefrontRow(
  productBrandId: string,
  storefrontBrandId: string,
  metadata?: unknown
): boolean {
  if (!productBrandId || productBrandId !== storefrontBrandId) return false;
  return isStreetPlayrCatalogMetadata(metadata);
}

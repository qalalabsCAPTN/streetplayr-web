import { normalizeSizeLabel, sizeFromSku } from '@/lib/products/sizes';

/** UniWare item fields → product_variants.attributes. Never rewrite SKU. */
export function variantAttributesFromUniware(input: {
  sku: string;
  color?: string | null;
  size?: string | null;
  ean?: string | null;
}): { color: string; size: string; ean?: string } {
  const size = normalizeSizeLabel(input.size || sizeFromSku(input.sku));
  const color = (input.color || '').trim() || 'Default';
  const rawEan = (input.ean || '').trim();
  const ean = rawEan && rawEan.toLowerCase() !== input.sku.toLowerCase() ? rawEan : '';
  return ean ? { color, size, ean } : { color, size };
}

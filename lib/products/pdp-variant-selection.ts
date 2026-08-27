import { normalizeSizeLabel, sortApparelSizes } from '@/lib/products/sizes';

export type PdpVariant = { id: string; size: string; stockQuantity: number };

/** Sizes that exist as real variants. Never invent a universal size list. */
export function sizesFromExistingVariants(variants: PdpVariant[]): string[] {
  return sortApparelSizes(variants.map((v) => v.size));
}

export function selectVariantBySize(
  variants: PdpVariant[],
  size: string
): PdpVariant | undefined {
  const n = normalizeSizeLabel(size);
  return variants.find((v) => normalizeSizeLabel(v.size) === n);
}

/** First in-stock variant, else first existing variant. Never invent sizes. */
export function initialVariantId(variants: PdpVariant[]): string {
  const inStock = variants.find((v) => v.stockQuantity > 0);
  return (inStock || variants[0])?.id ?? '';
}

/**
 * Clicking a size changes the canonical selected variant id.
 * Sold-out existing sizes stay selected-id unchanged (button disabled in UI).
 * Missing sizes are a no-op.
 */
export function applySizeClick(
  variants: PdpVariant[],
  currentId: string,
  size: string
): string {
  const v = selectVariantBySize(variants, size);
  if (!v || v.stockQuantity <= 0) return currentId;
  return v.id;
}

export function sizeIsSoldOut(variants: PdpVariant[], size: string): boolean {
  const v = selectVariantBySize(variants, size);
  return !v || v.stockQuantity <= 0;
}

export function sizeExists(variants: PdpVariant[], size: string): boolean {
  return Boolean(selectVariantBySize(variants, size));
}

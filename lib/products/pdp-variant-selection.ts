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

/** Leftmost displayed in-stock size, else leftmost existing size. Never invent sizes. */
export function initialVariantId(variants: PdpVariant[]): string {
  const sizes = sizesFromExistingVariants(variants);
  for (const size of sizes) {
    const match = selectVariantBySize(variants, size);
    if (match && match.stockQuantity > 0) return match.id;
  }
  const first = sizes[0] ? selectVariantBySize(variants, sizes[0]) : undefined;
  return first?.id ?? variants[0]?.id ?? '';
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

/** Sold-out selected variant disables Add to Bag / Buy Now. Empty selection stays clickable to prompt. */
export function pdpCtaSoldOut(selected: PdpVariant | undefined): boolean {
  return Boolean(selected && selected.stockQuantity <= 0);
}

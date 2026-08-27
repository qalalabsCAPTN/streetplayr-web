export const APPAREL_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL'] as const;

/** Canonical size-guide rows — XS → 2XL when that variant exists. */
export const SIZE_GUIDE_ROWS = [
  { size: 'XS', chestWaist: '34" / 28"', fit: 'Slim fit / standard waist' },
  { size: 'S', chestWaist: '36" / 30"', fit: 'Slim fit / standard waist' },
  { size: 'M', chestWaist: '38" / 32"', fit: 'Relaxed fit / standard waist' },
  { size: 'L', chestWaist: '40" / 34"', fit: 'Relaxed fit / comfortable waist' },
  { size: 'XL', chestWaist: '42" / 36"', fit: 'Oversized fit / comfortable waist' },
  { size: '2XL', chestWaist: '44" / 38"', fit: 'Oversized fit / comfortable waist' },
] as const;

/** Sizes StreetPlayR never sells. 2XL is valid when UniCommerce has the SKU. */
export const REMOVED_APPAREL_SIZES = new Set([
  'XXS',
  '3XL',
  '4XL',
  'xxs',
  '3xl',
  '4xl',
]);

const ORDER_INDEX = new Map<string, number>(
  APPAREL_SIZE_ORDER.map((size, index) => [size, index])
);

const REMOVED_NORMALIZED = new Set(
  [...REMOVED_APPAREL_SIZES].map((size) => normalizeSizeLabel(size))
);

export function normalizeSizeLabel(size: string): string {
  const n = size.trim().replace(/\s+/g, '').toUpperCase();
  if (n === 'XXL') return '2XL';
  return n;
}

export function sizeFromSku(sku: string): string {
  const lastDash = sku.lastIndexOf('-');
  const raw = lastDash > 0 ? sku.slice(lastDash + 1) : sku;
  return normalizeSizeLabel(raw);
}

export function isRemovedApparelSize(size: string): boolean {
  const normalized = normalizeSizeLabel(size);
  return normalized.length > 0 && REMOVED_NORMALIZED.has(normalized);
}

export function sortApparelSizes(sizes: string[]): string[] {
  const unique = new Set<string>();
  for (const size of sizes) {
    const normalized = normalizeSizeLabel(size);
    if (!normalized || isRemovedApparelSize(normalized)) continue;
    unique.add(normalized);
  }

  return [...unique].sort((a, b) => {
    const ai = ORDER_INDEX.get(a);
    const bi = ORDER_INDEX.get(b);
    const aKnown = ai !== undefined;
    const bKnown = bi !== undefined;
    if (aKnown && bKnown) return ai - bi;
    if (aKnown) return -1;
    if (bKnown) return 1;
    return a.localeCompare(b);
  });
}

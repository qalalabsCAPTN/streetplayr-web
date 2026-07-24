import { describe, expect, it } from 'vitest';

/**
 * Cart line identity contract — product_variants.id only (never handle|size).
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isCanonicalCartLineId(id: string): boolean {
  // Production CRM requires UUID; local demo may use slug-size ids but NEVER handle|size.
  return !id.includes('|');
}

function isSyncableVariantId(id: string): boolean {
  return UUID_RE.test(id);
}

describe('cart line identity', () => {
  it('rejects handle|size composite ids', () => {
    expect(isCanonicalCartLineId('waffle-tee|M')).toBe(false);
    expect(isCanonicalCartLineId('ctt-waffle-m')).toBe(true);
    expect(
      isCanonicalCartLineId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    ).toBe(true);
  });

  it('only syncs UUID variant ids to CRM cart_items', () => {
    expect(isSyncableVariantId('waffle-tee|M')).toBe(false);
    expect(isSyncableVariantId('ctt-waffle-m')).toBe(false);
    expect(
      isSyncableVariantId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    ).toBe(true);
  });
});

/**
 * @deprecated Import from `@/lib/products/collections` — collection membership is SoT.
 * Transitional re-exports only. No runtime side effects.
 */
export {
  COLLECTION_SLUG as CATEGORY,
  type CollectionSlug as CanonicalCategory,
  type FilterChip,
  DESKTOP_CHIPS,
  MOBILE_CHIPS,
  DISABLED_MOBILE,
  SORT_OPTIONS,
  type SortOption,
  chipToParam,
  paramToChip,
  normalizeCollectionSlug as normalizeCategory,
  chipToCollectionSlugs,
  productInCollections,
  localMembershipFor,
} from './collections';

/** @deprecated Removed — use collection membership. */
export function resolveProductCategory(_input: unknown): null {
  return null;
}

/** @deprecated Removed — use latest-drop collection membership. */
export function markLatestDrops(): Set<number> {
  return new Set();
}

/** @deprecated Removed — use productInCollections. */
export function matchesChip(): boolean {
  return false;
}

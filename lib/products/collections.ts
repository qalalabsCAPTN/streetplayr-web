/**
 * Collection Source of Truth
 * ---------------------------
 * Storefront filters MUST use collection membership (slug), never guessed metadata.
 *
 * Live DB:  public.collections + public.collection_products
 * Local:    LOCAL_COLLECTION_MEMBERSHIP (demo / offline)
 *
 * URL ?category= maps 1:1 to collection slug (except `all` = no filter).
 */

export const COLLECTION_SLUG = {
  LATEST: 'latest-drop',
  TEES: 'tees',
  LONG_SLEEVE: 'long-sleeve',
  TANKS: 'tanks',
  PANTS: 'pants',
  HOODIES: 'hoodies',
} as const;

export type CollectionSlug = (typeof COLLECTION_SLUG)[keyof typeof COLLECTION_SLUG];

export const CANONICAL_COLLECTIONS: {
  slug: CollectionSlug;
  name: string;
  sortOrder: number;
}[] = [
  { slug: COLLECTION_SLUG.LATEST, name: 'Latest Drop', sortOrder: 0 },
  { slug: COLLECTION_SLUG.TEES, name: 'Short Sleeve T-Shirts', sortOrder: 1 },
  { slug: COLLECTION_SLUG.LONG_SLEEVE, name: 'Long Sleeve T-Shirts', sortOrder: 2 },
  { slug: COLLECTION_SLUG.TANKS, name: 'Tanks', sortOrder: 3 },
  { slug: COLLECTION_SLUG.PANTS, name: 'Sweatpants', sortOrder: 4 },
  { slug: COLLECTION_SLUG.HOODIES, name: 'Hoodies', sortOrder: 5 },
];

const SLUG_SET = new Set<string>(Object.values(COLLECTION_SLUG));

/** Normalize URL / DB slug → known collection slug, or null (never guess). */
export function normalizeCollectionSlug(raw: string | null | undefined): CollectionSlug | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === 'all' || s === 'view-all') return null;
  // legacy aliases that still mean pants collection
  if (s === 'sweatpants' || s === 'bottomwear' || s === 'bottoms') return COLLECTION_SLUG.PANTS;
  if (s === 'latest' || s === 'latest-drop') return COLLECTION_SLUG.LATEST;
  if (SLUG_SET.has(s)) return s as CollectionSlug;
  return null;
}

export type FilterChip =
  | 'Latest Drop'
  | 'All Products'
  | 'Short Sleeve T-Shirts'
  | 'Long Sleeve T-Shirts'
  | 'Tanks'
  | 'Sweatpants'
  | 'View all'
  | 'Topwear'
  | 'Bottomwear'
  | 'Hoodies';

export const DESKTOP_CHIPS: FilterChip[] = [
  'Short Sleeve T-Shirts',
  'Long Sleeve T-Shirts',
  'Tanks',
  'Sweatpants',
];

export const MOBILE_CHIPS: FilterChip[] = [
  'View all',
  'Topwear',
  'Bottomwear',
  'Hoodies',
];

export const DISABLED_MOBILE: FilterChip[] = ['Hoodies'];

export const SORT_OPTIONS = [
  'Popular',
  'Newest',
  'Price Low→High',
  'Price High→Low',
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

const TOPWEAR_SLUGS: CollectionSlug[] = [
  COLLECTION_SLUG.TEES,
  COLLECTION_SLUG.LONG_SLEEVE,
  COLLECTION_SLUG.TANKS,
];

export function chipToParam(chip: FilterChip): string | null {
  switch (chip) {
    case 'View all':
    case 'All Products':
      return 'all';
    case 'Latest Drop':
      return null; // default route = latest-drop
    case 'Short Sleeve T-Shirts':
      return COLLECTION_SLUG.TEES;
    case 'Long Sleeve T-Shirts':
      return COLLECTION_SLUG.LONG_SLEEVE;
    case 'Tanks':
      return COLLECTION_SLUG.TANKS;
    case 'Sweatpants':
    case 'Bottomwear':
      return COLLECTION_SLUG.PANTS;
    case 'Topwear':
      return 'topwear';
    case 'Hoodies':
      return COLLECTION_SLUG.HOODIES;
    default:
      return null;
  }
}

export function paramToChip(category: string, mobile: boolean): FilterChip {
  const raw = (category || '').trim().toLowerCase();
  if (!raw || raw === 'latest' || raw === 'latest-drop' || raw === 'all') {
    return mobile ? 'View all' : 'Short Sleeve T-Shirts';
  }
  if (raw === 'topwear') return mobile ? 'Topwear' : 'Short Sleeve T-Shirts';
  if (raw === 'bottomwear') return mobile ? 'Bottomwear' : 'Sweatpants';

  const slug = normalizeCollectionSlug(raw);
  if (mobile) {
    if (slug === COLLECTION_SLUG.HOODIES) return 'Hoodies';
    if (slug === COLLECTION_SLUG.PANTS) return 'Bottomwear';
    if (slug && TOPWEAR_SLUGS.includes(slug)) return 'Topwear';
    return 'View all';
  }
  if (slug === COLLECTION_SLUG.TEES) return 'Short Sleeve T-Shirts';
  if (slug === COLLECTION_SLUG.LONG_SLEEVE) return 'Long Sleeve T-Shirts';
  if (slug === COLLECTION_SLUG.TANKS) return 'Tanks';
  if (slug === COLLECTION_SLUG.PANTS) return 'Sweatpants';
  if (slug === COLLECTION_SLUG.HOODIES) return 'Hoodies';
  return 'Short Sleeve T-Shirts';
}

/** Slugs a chip requires membership in (OR). Empty = show all products. */
export function chipToCollectionSlugs(chip: FilterChip): CollectionSlug[] | 'ALL' {
  switch (chip) {
    case 'View all':
    case 'All Products':
      return 'ALL';
    case 'Latest Drop':
      return [COLLECTION_SLUG.LATEST];
    case 'Short Sleeve T-Shirts':
      return [COLLECTION_SLUG.TEES];
    case 'Long Sleeve T-Shirts':
      return [COLLECTION_SLUG.LONG_SLEEVE];
    case 'Tanks':
      return [COLLECTION_SLUG.TANKS];
    case 'Sweatpants':
    case 'Bottomwear':
      return [COLLECTION_SLUG.PANTS];
    case 'Topwear':
      return TOPWEAR_SLUGS;
    case 'Hoodies':
      return [COLLECTION_SLUG.HOODIES];
    default:
      return 'ALL';
  }
}

export function productInCollections(
  membership: string[] | null | undefined,
  required: CollectionSlug[] | 'ALL'
): boolean {
  if (required === 'ALL') return true;
  if (!membership || membership.length === 0) return false;
  const set = new Set(membership.map((s) => s.toLowerCase()));
  return required.some((slug) => set.has(slug));
}

/**
 * Local / demo membership — mirrors what production collection_products should hold.
 * A product may belong to multiple collections (e.g. latest-drop + tees).
 */
export const LOCAL_COLLECTION_MEMBERSHIP: Record<string, CollectionSlug[]> = {
  'ctt-waffle': [COLLECTION_SLUG.LATEST, COLLECTION_SLUG.TEES],
  'warrior-tee': [COLLECTION_SLUG.LATEST, COLLECTION_SLUG.TEES],
  inspired: [COLLECTION_SLUG.LATEST, COLLECTION_SLUG.TEES],
  'star-tank-dark': [COLLECTION_SLUG.TANKS],
  'carpenter-grey': [COLLECTION_SLUG.PANTS],
  'stick-no-bills': [COLLECTION_SLUG.LATEST, COLLECTION_SLUG.LONG_SLEEVE],
  'warrior-bob': [COLLECTION_SLUG.TEES],
  // slug aliases used as product ids in some paths
  'black-warrior': [COLLECTION_SLUG.LATEST, COLLECTION_SLUG.TEES],
};

export function localMembershipFor(productId: string, slug?: string): CollectionSlug[] {
  return (
    LOCAL_COLLECTION_MEMBERSHIP[productId] ||
    (slug ? LOCAL_COLLECTION_MEMBERSHIP[slug] : undefined) ||
    []
  );
}

/** @deprecated Use collection membership. Kept only for UniCommerce label display. */
export function legacyCategoryLabel(slug: CollectionSlug): string {
  const row = CANONICAL_COLLECTIONS.find((c) => c.slug === slug);
  return row?.name ?? slug;
}

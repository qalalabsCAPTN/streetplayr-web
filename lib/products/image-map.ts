/**
 * Map UniCommerce / DB product slugs → storefront image assets under /public/assets/products.
 * UniCommerce item types do not ship media URLs; we attach known playR streetwear photos.
 * All images are converted to WebP format as the single authoritative media standard.
 */

export type ProductImagePack = {
  featured: string;
  gallery: string[];
};

function gallery(folder: string): string[] {
  return [1, 2, 3, 4, 5].map((n) => `/assets/products/${folder}/image-${n}.webp`);
}

function pack(folder: string): ProductImagePack {
  const g = gallery(folder);
  return { featured: g[0], gallery: g };
}

/**
 * Rewrite legacy/broken asset paths (old .jpg flat paths, pre-webp gallery URLs)
 * to the current webp pack under /public/assets/products.
 */
export function normalizeProductImageUrl(
  url: string | null | undefined,
  slug?: string | null
): string {
  if (!url?.trim()) {
    return resolveProductImages(slug)?.featured ?? '';
  }

  let u = url.trim();

  // Flat legacy inspired thumbnail — common in old DB rows + persisted carts
  if (/\/products\/inspired\.jpg$/i.test(u)) {
    u = '/assets/products/inspired/image-1.webp';
  }

  // image-N.jpg → image-N.webp for webp-only asset folders
  u = u.replace(/^(\/assets\/products\/[^/]+\/image-\d+)\.jpg$/i, '$1.webp');

  return u;
}

/** Best image for a cart line — normalizes legacy URLs and falls back to slug pack. */
export function resolveCartLineImage(
  image: string | null | undefined,
  slug?: string | null
): string {
  const normalized = normalizeProductImageUrl(image, slug);
  if (normalized) return normalized;
  return resolveProductImages(slug)?.featured ?? '/images/placeholder.jpg';
}

/** Exact slug → asset pack (UniCommerce parent SKUs + local demo slugs). */
const BY_SLUG: Record<string, ProductImagePack> = {
  // Create waffle tee
  'ctt-waffle': pack('ctt-waffle'),
  'PS-TEE-CRT-WHT': pack('ctt-waffle'),
  'PS-TEE-CRT-RED': pack('ctt-maroon'),
  
  // Warrior tee
  'PS-TEE-WAR-BRW': pack('brown-warrior'),
  'PS-TEE-WAR-BLK': pack('black-warrior'),
  
  // Inspired
  'inspired': pack('inspired'),
  'PS-TEE-INS-PRP': pack('inspired'),
  
  // STAAR tanks
  'PS-TNK-STR-BLK': pack('star-tank-dark'),
  'PS-TNK-STR-WHT': pack('star-tank-white'),
  
  // Carpenter / pants
  'PS-PNT-CARP-GRY': pack('carpenter-grey'),
  'PS-PNT-CARP-GRN': pack('carpenter-olive'),
  'PS-PNT-CORE-BLK': pack('sweat-pant-black'),
  'PS-PNT-CORE-CRM': pack('sweat-pants-white'),
  
  // Long sleeve / SNB
  'stick-no-bills': pack('stick-no-bills'),
};

/** Prefix fallbacks when exact slug missing (size-suffixed SKUs etc.). */
const BY_PREFIX: Array<{ prefix: string; pack: ProductImagePack }> = [
  { prefix: 'PS-TEE-CRT-RED', pack: pack('ctt-maroon') },
  { prefix: 'PS-TEE-CRT', pack: pack('ctt-waffle') },
  { prefix: 'PS-TEE-WAR-BRW', pack: pack('brown-warrior') },
  { prefix: 'PS-TEE-WAR-BLK', pack: pack('black-warrior') },
  { prefix: 'PS-TEE-INS', pack: pack('inspired') },
  { prefix: 'PS-TNK-STR-BLK', pack: pack('star-tank-dark') },
  { prefix: 'PS-TNK-STR-WHT', pack: pack('star-tank-white') },
  { prefix: 'PS-PNT-CARP-GRN', pack: pack('carpenter-olive') },
  { prefix: 'PS-PNT-CARP', pack: pack('carpenter-grey') },
  { prefix: 'PS-PNT-CORE-BLK', pack: pack('sweat-pant-black') },
  { prefix: 'PS-PNT-CORE-CRM', pack: pack('sweat-pants-white') },
];

export function resolveProductImages(
  slug: string | null | undefined,
  existing?: { featured?: string | null; gallery?: string[] | null }
): ProductImagePack | null {
  if (existing?.featured) {
    const normalizedFeatured = normalizeProductImageUrl(existing.featured, slug);
    const galleryFromMeta =
      Array.isArray(existing.gallery) && existing.gallery.length > 0
        ? existing.gallery.map((g) => normalizeProductImageUrl(g, slug))
        : [normalizedFeatured];
    if (normalizedFeatured) {
      return { featured: normalizedFeatured, gallery: galleryFromMeta };
    }
  }

  if (!slug) return null;
  const key = slug.trim();
  if (BY_SLUG[key]) return BY_SLUG[key];

  const upper = key.toUpperCase();
  for (const row of BY_PREFIX) {
    if (upper.startsWith(row.prefix.toUpperCase())) return row.pack;
  }
  return null;
}

/** SQL-friendly rows for backfilling featured_image_url on live DB. */
export function imageBackfillRows(): Array<{ slug: string; featured: string; gallery: string[] }> {
  return Object.entries(BY_SLUG).map(([slug, pack]) => ({
    slug,
    featured: pack.featured,
    gallery: pack.gallery,
  }));
}

/**
 * Map UniCommerce / DB product slugs → storefront image assets under /public/assets/products.
 * UniCommerce item types do not ship media URLs; we attach known playR streetwear photos.
 */

export type ProductImagePack = {
  featured: string;
  gallery: string[];
};

const WEBP_FRAMES = new Set([
  'black-warrior/1',
  'black-warrior/3',
  'black-warrior/5',
  'brown-warrior/1',
  'brown-warrior/3',
  'brown-warrior/5',
  'ctt-waffle/1',
  'ctt-waffle/5',
  'inspired/1',
  'inspired/3',
  'inspired/5',
  'warrior-bob/1',
]);

function gallery(folder: string): string[] {
  return [1, 2, 3, 4, 5].map((n) => {
    const ext = WEBP_FRAMES.has(`${folder}/${n}`) ? 'webp' : 'jpg';
    return `/assets/products/${folder}/image-${n}.${ext}`;
  });
}

function pack(folder: string): ProductImagePack {
  const g = gallery(folder);
  return { featured: g[0], gallery: g };
}

/** Exact slug → asset pack (UniCommerce parent SKUs + local demo slugs). */
const BY_SLUG: Record<string, ProductImagePack> = {
  // Create waffle tee
  'ctt-waffle': pack('ctt-waffle'),
  'PS-TEE-CRT-WHT': pack('ctt-waffle'),
  'PS-TEE-CRT-RED': pack('ctt-maroon'),
  // Warrior tee
  'black-warrior': pack('black-warrior'),
  'warrior-tee': pack('black-warrior'),
  'PS-TEE-WAR-BLK': pack('black-warrior'),
  'PS-TEE-WAR-BRW': pack('brown-warrior'),
  // Inspired
  inspired: pack('inspired'),
  'PS-TEE-INS-PRP': pack('inspired'),
  // STAAR tanks (white assets not shot yet — reuse dark pack so shelf isn't blank)
  'star-tank-dark': pack('star-tank-dark'),
  'PS-TNK-STR-BLK': pack('star-tank-dark'),
  'PS-TNK-STR-WHT': pack('star-tank-dark'),
  // Carpenter / pants
  'carpenter-grey': pack('carpenter-grey'),
  'PS-PNT-CARP-GRY': pack('carpenter-grey'),
  'PS-PNT-CARP-GRN': pack('carpenter-olive'),
  'PS-PNT-CORE-BLK': pack('carpenter-grey'),
  'PS-PNT-CORE-CRM': pack('carpenter-grey'),
  // Long sleeve / SNB
  'stick-no-bills': pack('stick-no-bills'),
  // Bob
  'warrior-bob': pack('warrior-bob'),
};

/** Prefix fallbacks when exact slug missing (size-suffixed SKUs etc.). */
const BY_PREFIX: Array<{ prefix: string; pack: ProductImagePack }> = [
  { prefix: 'PS-TEE-CRT-RED', pack: pack('ctt-maroon') },
  { prefix: 'PS-TEE-CRT', pack: pack('ctt-waffle') },
  { prefix: 'PS-TEE-WAR-BRW', pack: pack('brown-warrior') },
  { prefix: 'PS-TEE-WAR', pack: pack('black-warrior') },
  { prefix: 'PS-TEE-INS', pack: pack('inspired') },
  { prefix: 'PS-TNK-STR', pack: pack('star-tank-dark') },
  { prefix: 'PS-PNT-CARP-GRN', pack: pack('carpenter-olive') },
  { prefix: 'PS-PNT-CARP', pack: pack('carpenter-grey') },
  { prefix: 'PS-PNT-CORE', pack: pack('carpenter-grey') },
];

export function resolveProductImages(
  slug: string | null | undefined,
  existing?: { featured?: string | null; gallery?: string[] | null }
): ProductImagePack | null {
  if (existing?.featured) {
    const galleryFromMeta =
      Array.isArray(existing.gallery) && existing.gallery.length > 0
        ? existing.gallery
        : [existing.featured];
    return { featured: existing.featured, gallery: galleryFromMeta };
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

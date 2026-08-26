/**
 * Storefront product catalog queries.
 * Collection membership (collections + collection_products) is the ONLY filter SoT.
 */

import { createStaticClient } from '@/lib/supabase/static';
import { resolveStorefrontBrandId } from './brand';
import {
  getLocalProductBySlug,
  getLocalActiveProducts,
  LOCAL_PRODUCTS,
} from '@/lib/products/data';
import {
  COLLECTION_SLUG,
  localMembershipFor,
  type CollectionSlug,
} from '@/lib/products/collections';
import {
  allowLocalCatalog,
  allowLocalMembershipFallback,
  isSupabaseLive,
} from '@/lib/products/env';
import {
  logCatalogDegraded,
  readCatalogLkg,
  saveCatalogLkg,
} from '@/lib/products/catalog-cache';
import { normalizeProductImageUrl, resolveProductImages } from '@/lib/products/image-map';
import { withClientProductCopy, displayProductName } from '@/lib/products/copy';
import { BEST_SELLERS_LIMIT, BEST_SELLERS_WINDOW_DAYS, bestSellersSince } from '@/lib/products/best-sellers';
import { sortApparelSizes, isRemovedApparelSize, normalizeSizeLabel } from '@/lib/products/sizes';

export interface FeedItemData {
  id: string;
  type: 'product' | 'campaign' | 'typography';
  category: string;
  layoutType: 'tall' | 'square' | 'landscape' | 'full';
  slug?: string;
  title?: string;
  price?: string;
  image1?: string;
  image2?: string;
  metadata?: { drop: string; fabric: string };
  content?: string;
  image?: string;
}

export type CatalogVariant = {
  id: string;
  size: string;
  price?: number;
  stockQuantity?: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  slug: string;
  image: string;
  image2?: string;
  /** Searchable product copy (name + description) */
  description?: string;
  /** Collection slugs this product belongs to. Empty = uncategorized (exclude from filters). */
  collections: CollectionSlug[];
  createdAt: number;
  /** product_variants for cart line UUID resolution */
  variants?: CatalogVariant[];
  metadata?: Record<string, unknown>;
  className?: string;
};

function mapCatalogVariants(
  raw: { id: string; price?: number; title?: string; attributes?: { size?: string } }[] | null | undefined
): CatalogVariant[] {
  const mapped: CatalogVariant[] = (raw ?? [])
    .map((v) => ({
      id: v.id,
      size: v.attributes?.size || v.title || 'M',
      price: v.price,
    }))
    .filter((v) => !isRemovedApparelSize(v.size));
  const order = sortApparelSizes(mapped.map((v) => v.size));
  const bySize = new Map(mapped.map((v) => [normalizeSizeLabel(v.size), v]));
  return order
    .map((size) => bySize.get(size))
    .filter((v): v is CatalogVariant => v !== undefined);
}

const EDITORIAL_ITEMS: FeedItemData[] = [
  {
    id: 'c1',
    type: 'typography',
    category: 'ALL',
    layoutType: 'full',
    content: 'STRIPPED OF EXCESS. DEFINED BY FORM. ARCHITECTURE FOR THE STREETS.',
  },
  {
    id: 'c3',
    type: 'campaign',
    category: 'ALL',
    layoutType: 'full',
    image:
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=2000&auto=format&fit=crop',
    content: 'STUDY IN FORM.',
  },
  {
    id: 'c2',
    type: 'campaign',
    category: 'ALL',
    layoutType: 'full',
    image:
      'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2000&auto=format&fit=crop',
  },
];

function formatSupabaseError(error: unknown) {
  if (!error) return 'Unknown error';
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    return {
      message: errObj.message || String(error),
      code: errObj.code || undefined,
      details: errObj.details || undefined,
      hint: errObj.hint || undefined,
    };
  }
  return String(error);
}

function mapLocalCatalog(): CatalogProduct[] {
  if (!allowLocalCatalog()) return [];
  return getLocalActiveProducts().map((p, i) => {
    const full = LOCAL_PRODUCTS.find((lp) => lp.id === p.id || lp.slug === p.slug);
    const collections = localMembershipFor(p.id, p.slug);
    if (collections.length === 0 && process.env.NODE_ENV !== 'production') {
      console.warn(`[catalog] Product ${p.slug} has no collection membership — excluded from filters`);
    }
    return {
      id: p.id,
      name: displayProductName(p.name),
      price: p.price,
      slug: p.slug,
      image: p.image,
      image2: full?.metadata.gallery_images?.[1],
      description: withClientProductCopy(p.slug, p.name, full?.description ?? p.description ?? ''),
      collections,
      createdAt: Date.now() - i * 1000,
      variants: mapCatalogVariants(
        (full?.variants ?? [])
          .filter((v) => !isRemovedApparelSize(v.size))
          .map((v) => ({
            id: v.id,
            size: v.size,
            price: v.price_override ?? p.price,
          }))
      ),
      metadata: full?.metadata as Record<string, unknown> | undefined,
    };
  });
}

/** Live miss/outage: LKG → optional local (flag/dev) → empty. Never auto-demo in prod. */
function resolveCatalogFallback(reason: string): CatalogProduct[] {
  const lkg = readCatalogLkg();
  if (lkg) {
    logCatalogDegraded('lkg', `${reason}; ageMs=${lkg.ageMs}`);
    return lkg.products;
  }
  if (allowLocalCatalog()) {
    logCatalogDegraded('local', reason);
    return mapLocalCatalog();
  }
  logCatalogDegraded('empty', reason);
  return [];
}

function resolveMembership(
  productId: string,
  slug: string,
  fromDb: CollectionSlug[]
): CollectionSlug[] {
  if (fromDb.length > 0) return fromDb;
  // Production: never invent collections from demo map
  if (!allowLocalMembershipFallback()) return [];
  return localMembershipFor(productId, slug);
}

/**
 * Load product_id → collection slugs from junction table.
 */
async function fetchMembershipMap(
  supabase: ReturnType<typeof createStaticClient>
): Promise<Map<string, CollectionSlug[]>> {
  const map = new Map<string, CollectionSlug[]>();
  const { data, error } = await supabase
    .from('collection_products')
    .select('product_id, collections!inner(slug, is_active)');

  if (error) {
    console.warn('[catalog] collection_products query failed:', formatSupabaseError(error));
    return map;
  }

  for (const row of data || []) {
    const col = (row as any).collections;
    if (!col?.slug || col.is_active === false) continue;
    const slug = String(col.slug).toLowerCase() as CollectionSlug;
    const list = map.get(row.product_id) || [];
    if (!list.includes(slug)) list.push(slug);
    map.set(row.product_id, list);
  }
  return map;
}

function isValidStorefrontProduct(p: any): boolean {
  if (!p) return false;
  
  // 1. Status check
  const status = p.status ?? (p.is_active !== false ? 'active' : 'draft');
  if (status !== 'active') return false;

  // 2. Metadata draft/placeholder flags
  const meta = p.metadata || {};
  if (meta.draft === true || meta.placeholder === true) return false;

  // 3. Slug check
  if (!p.slug || typeof p.slug !== 'string' || p.slug.trim() === '') return false;

  // 4. Featured image check
  const featured = p.image || p.featured_image_url || p.image_url;
  if (!featured || typeof featured !== 'string' || featured.trim() === '' || featured.includes('null')) return false;

  // 5. Gallery images check
  const gallery = meta.gallery_images || p.gallery;
  if (!Array.isArray(gallery) || gallery.length === 0) return false;
  if (gallery.some((img: any) => !img || typeof img !== 'string' || img.trim() === '' || img.includes('null'))) return false;

  // 6. Variants/Inventory check (has at least one variant to prevent ghost listings)
  const variants = p.variants;
  if (!Array.isArray(variants) || variants.length === 0) return false;

  return true;
}

function getDefaultClassName(idx: number) {
  return idx === 0 ? 'md:col-span-5 md:mt-24' : idx === 1 ? 'md:col-span-3' : 'md:col-span-4 md:mt-48';
}

export const ProductQueries = {
  async getCatalogProducts(): Promise<CatalogProduct[]> {
    if (!isSupabaseLive()) {
      const local = mapLocalCatalog();
      if (local.length) logCatalogDegraded('local', 'supabase not live');
      else logCatalogDegraded('empty', 'supabase not live');
      return local.filter(isValidStorefrontProduct);
    }

    try {
      const supabase = createStaticClient();
      const brandId = await resolveStorefrontBrandId(supabase);
      const { data, error } = await supabase
        .from('products')
        .select(
          `id, title, slug, description, featured_image_url, metadata, status, created_at, product_variants(id, price, title, attributes)`
        )
        .eq('status', 'active')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const reason = error
          ? `products query failed: ${JSON.stringify(formatSupabaseError(error))}`
          : 'products query returned 0 rows';
        return resolveCatalogFallback(reason).filter(isValidStorefrontProduct);
      }

      const membership = await fetchMembershipMap(supabase);

      const mapped = data.map((p) => {
        const variants = mapCatalogVariants(p.product_variants as any);
        const prices = variants.map((v) => v.price).filter((n): n is number => typeof n === 'number');
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const collections = resolveMembership(p.id, p.slug, membership.get(p.id) || []);

        if (collections.length === 0) {
          console.warn(
            `[catalog] Product "${p.slug}" (${p.id}) has no collection_products row — excluded from filtered collections`
          );
        }

        const meta = (p.metadata || {}) as Record<string, unknown>;
        const galleryMeta = Array.isArray(meta.gallery_images)
          ? (meta.gallery_images as string[])
          : null;
        const images = resolveProductImages(p.slug, {
          featured: p.featured_image_url,
          gallery: galleryMeta,
        });
        const featured = images?.featured || p.featured_image_url || '';
        const image2 = images?.gallery?.[1] || galleryMeta?.[1] || featured;

        return {
          id: p.id,
          name: displayProductName(p.title),
          price: minPrice,
          slug: p.slug,
          image: featured,
          image2,
          description: withClientProductCopy(
            p.slug,
            p.title,
            (typeof p.description === 'string' && p.description) ||
              (typeof meta.description === 'string' ? meta.description : '') ||
              ''
          ),
          collections,
          createdAt: p.created_at ? Date.parse(p.created_at) : 0,
          variants,
          metadata: {
            ...meta,
            ...(images ? { gallery_images: images.gallery } : {}),
          },
        };
      });

      const filteredMapped = mapped.filter(isValidStorefrontProduct);

      if (!filteredMapped.some((p) => p.collections.length > 0)) {
        console.warn(
          '[catalog] No collection membership resolved — returning unfiltered DB products'
        );
      }

      saveCatalogLkg(filteredMapped);
      return filteredMapped;
    } catch (err) {
      console.error('[catalog] getCatalogProducts exception:', formatSupabaseError(err));
      return resolveCatalogFallback(`exception: ${JSON.stringify(formatSupabaseError(err))}`).filter(isValidStorefrontProduct);
    }
  },

  async getProductsByCollection(slug: CollectionSlug | 'ALL'): Promise<CatalogProduct[]> {
    const all = await this.getCatalogProducts();
    if (slug === 'ALL') return all;
    return all.filter((p) => p.collections.includes(slug));
  },

  async getLatestDrops() {
    const drops = await this.getProductsByCollection(COLLECTION_SLUG.LATEST);
    return drops.slice(0, 10).map((p, idx) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      image2: p.image2 || p.image,
      slug: p.slug,
      category: COLLECTION_SLUG.LATEST,
      collections: p.collections,
      className: p.className || getDefaultClassName(idx),
    }));
  },

  async getActiveProducts() {
    const all = await this.getCatalogProducts();
    return all.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      slug: p.slug,
      image: p.image,
      category: p.collections[0],
      collections: p.collections,
      variants: p.variants,
    }));
  },

  async getEditorialFeed(): Promise<FeedItemData[]> {
    const products = await this.getActiveProducts();
    if (products.length === 0) return EDITORIAL_ITEMS;

    const productFeed: FeedItemData[] = products.map((p, i) => ({
      id: `p-${p.id}`,
      type: 'product' as const,
      slug: p.slug,
      title: p.name,
      price: p.price ? `${p.price}` : undefined,
      image1: p.image || undefined,
      image2: p.image || undefined,
      category: p.collections?.[0] || 'ALL',
      metadata: { drop: 'DROP', fabric: 'PREMIUM' },
      layoutType: (['tall', 'square', 'landscape', 'tall', 'square', 'tall'] as const)[i % 6],
    }));

    return [...productFeed, ...EDITORIAL_ITEMS];
  },

  async getBestSellers(limit = BEST_SELLERS_LIMIT): Promise<CatalogProduct[]> {
    const catalog = await this.getCatalogProducts();
    if (catalog.length === 0) return [];

    const byId = new Map(catalog.map((p) => [p.id, p]));
    const bySlug = new Map(catalog.map((p) => [p.slug.toLowerCase(), p]));

    if (!isSupabaseLive()) {
      return catalog.slice(0, limit);
    }

    try {
      const supabase = createStaticClient();
      const since = bestSellersSince().toISOString();
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, quantity, sku, orders!inner(created_at, payment_status, status)')
        .gte('orders.created_at', since);

      if (error || !data) {
        console.warn(
          `[catalog] best-sellers query failed (${BEST_SELLERS_WINDOW_DAYS}d); using catalog fallback`,
          error?.message
        );
        return catalog.slice(0, limit);
      }

      const qty = new Map<string, number>();
      for (const row of data as Array<{
        product_id?: string;
        quantity?: number;
        sku?: string;
        orders?: { payment_status?: string; status?: string };
      }>) {
        const paid =
          row.orders?.payment_status === 'paid' ||
          row.orders?.status === 'confirmed' ||
          row.orders?.status === 'paid';
        if (!paid) continue;
        const key = row.product_id || row.sku || '';
        if (!key) continue;
        qty.set(key, (qty.get(key) ?? 0) + (row.quantity ?? 0));
      }

      const ranked = [...qty.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => byId.get(key) || bySlug.get(key.toLowerCase()))
        .filter((p): p is CatalogProduct => Boolean(p));

      const unique: CatalogProduct[] = [];
      const seen = new Set<string>();
      for (const p of ranked) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        unique.push(p);
        if (unique.length >= limit) break;
      }

      if (unique.length < limit) {
        for (const p of catalog) {
          if (seen.has(p.id)) continue;
          unique.push(p);
          seen.add(p.id);
          if (unique.length >= limit) break;
        }
      }
      if (unique.length > 0) return unique.slice(0, limit);
      return catalog.slice(0, limit);
    } catch (err) {
      console.warn('[catalog] best-sellers exception; using catalog fallback', err);
      return catalog.slice(0, limit);
    }
  },

  async getProductBySlug(slug: string) {
    const fromLkgOrLocal = () => {
      const lkg = readCatalogLkg();
      const hit = lkg?.products.find((p) => p.slug === slug || p.slug.toLowerCase() === slug.toLowerCase());
      if (hit) {
        logCatalogDegraded('lkg', `getProductBySlug(${slug})`);
        const result = {
          id: hit.id,
          name: displayProductName(hit.name),
          slug: hit.slug,
          price: hit.price,
          description: withClientProductCopy(hit.slug, hit.name, ''),
          image_url: hit.image,
          category: hit.collections[0] || '',
          collections: hit.collections,
          variants: (hit.variants ?? [])
            .filter((v) => !isRemovedApparelSize(v.size))
            .map((v) => ({
            id: v.id,
            size: v.size,
            color: 'Default',
            stock_quantity: 0,
            price_override: v.price,
          })),
          metadata: hit.metadata ?? {},
          is_active: true,
        };
        return isValidStorefrontProduct(result) ? result : null;
      }
      if (allowLocalCatalog()) {
        logCatalogDegraded('local', `getProductBySlug(${slug})`);
        const result = getLocalProductBySlug(slug) || null;
        return isValidStorefrontProduct(result) ? result : null;
      }
      return null;
    };

    if (!isSupabaseLive()) {
      if (allowLocalCatalog()) {
        const result = getLocalProductBySlug(slug) || null;
        return isValidStorefrontProduct(result) ? result : null;
      }
      return null;
    }
    try {
      const supabase = createStaticClient();
      const brandId = await resolveStorefrontBrandId(supabase);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          description,
          featured_image_url,
          metadata,
          status,
          product_variants(id, sku, title, price, attributes)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .eq('brand_id', brandId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product by slug:', formatSupabaseError(error));
        return fromLkgOrLocal();
      }

      if (!data) return fromLkgOrLocal();

      const variants = (data.product_variants ?? [])
        .map((v: any) => ({
          id: v.id,
          size: v.attributes?.size || v.title,
          color: v.attributes?.color ?? 'Default',
          stock_quantity: 0,
          price_override: v.price,
        }))
        .filter((v: { size: string }) => !isRemovedApparelSize(v.size));
      const sizeOrder = sortApparelSizes(variants.map((v: { size: string }) => v.size));
      const bySize = new Map(
        variants.map((v: { size: string }) => [normalizeSizeLabel(v.size), v])
      );
      const sortedVariants = sizeOrder
        .map((size) => bySize.get(size))
        .filter(Boolean);

      const minPrice =
        variants.length > 0 ? Math.min(...variants.map((v: any) => v.price_override)) : 0;

      const membership = await fetchMembershipMap(supabase);
      const collections = resolveMembership(data.id, data.slug, membership.get(data.id) || []);

      const meta = (data.metadata ?? {}) as Record<string, unknown>;
      const galleryMeta = Array.isArray(meta.gallery_images)
        ? (meta.gallery_images as string[])
        : null;
      const images = resolveProductImages(data.slug, {
        featured: data.featured_image_url,
        gallery: galleryMeta,
      });
      const featured =
        images?.featured ||
        normalizeProductImageUrl(data.featured_image_url, data.slug) ||
        '';
      const gallery =
        images?.gallery ||
        (galleryMeta?.map((g) => normalizeProductImageUrl(g, data.slug)) ?? [featured]);

      const result = {
        id: data.id,
        name: displayProductName(data.title),
        slug: data.slug,
        price: minPrice,
        description: withClientProductCopy(
          data.slug,
          data.title,
          data.description ?? ''
        ),
        image_url: featured,
        category: collections[0] || '',
        collections,
        variants: sortedVariants,
        metadata: { ...meta, gallery_images: gallery },
        is_active: data.status === 'active',
      };

      return isValidStorefrontProduct(result) ? result : null;
    } catch (err) {
      console.error('Exception in getProductBySlug:', formatSupabaseError(err));
      return fromLkgOrLocal();
    }
  },
};

/**
 * Storefront product catalog queries.
 * Collection membership (collections + collection_products) is the ONLY filter SoT.
 */

import { createStaticClient } from '@/lib/supabase/static';
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
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  slug: string;
  image: string;
  image2?: string;
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
  return (raw ?? []).map((v) => ({
    id: v.id,
    size: v.attributes?.size || v.title || 'M',
    price: v.price,
  }));
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
      name: p.name,
      price: p.price,
      slug: p.slug,
      image: p.image,
      image2: full?.metadata.gallery_images?.[1],
      collections,
      createdAt: Date.now() - i * 1000,
      variants: (full?.variants ?? []).map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price_override ?? p.price,
      })),
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

function getDefaultClassName(idx: number) {
  return idx === 0 ? 'md:col-span-5 md:mt-24' : idx === 1 ? 'md:col-span-3' : 'md:col-span-4 md:mt-48';
}

export const ProductQueries = {
  async getCatalogProducts(): Promise<CatalogProduct[]> {
    if (!isSupabaseLive()) {
      const local = mapLocalCatalog();
      if (local.length) logCatalogDegraded('local', 'supabase not live');
      else logCatalogDegraded('empty', 'supabase not live');
      return local;
    }

    try {
      const supabase = createStaticClient();
      const { data, error } = await supabase
        .from('products')
        .select(
          `id, title, slug, featured_image_url, metadata, status, created_at, product_variants(id, price, title, attributes)`
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        const reason = error
          ? `products query failed: ${JSON.stringify(formatSupabaseError(error))}`
          : 'products query returned 0 rows';
        return resolveCatalogFallback(reason);
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

        return {
          id: p.id,
          name: p.title,
          price: minPrice,
          slug: p.slug,
          image: p.featured_image_url,
          image2: p.metadata?.gallery_images?.[1] || p.featured_image_url,
          collections,
          createdAt: p.created_at ? Date.parse(p.created_at) : 0,
          variants,
          metadata: p.metadata || {},
        };
      });

      if (!mapped.some((p) => p.collections.length > 0)) {
        console.warn(
          '[catalog] No collection membership resolved — returning unfiltered DB products'
        );
      }

      saveCatalogLkg(mapped);
      return mapped;
    } catch (err) {
      console.error('[catalog] getCatalogProducts exception:', formatSupabaseError(err));
      return resolveCatalogFallback(`exception: ${JSON.stringify(formatSupabaseError(err))}`);
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

  async getProductBySlug(slug: string) {
    const fromLkgOrLocal = () => {
      const lkg = readCatalogLkg();
      const hit = lkg?.products.find((p) => p.slug === slug || p.slug.toLowerCase() === slug.toLowerCase());
      if (hit) {
        logCatalogDegraded('lkg', `getProductBySlug(${slug})`);
        return {
          id: hit.id,
          name: hit.name,
          slug: hit.slug,
          price: hit.price,
          description: '',
          image_url: hit.image,
          category: hit.collections[0] || '',
          collections: hit.collections,
          variants: (hit.variants ?? []).map((v) => ({
            id: v.id,
            size: v.size,
            color: 'Default',
            stock_quantity: 0,
            price_override: v.price,
          })),
          metadata: hit.metadata ?? {},
          is_active: true,
        };
      }
      if (allowLocalCatalog()) {
        logCatalogDegraded('local', `getProductBySlug(${slug})`);
        return getLocalProductBySlug(slug) || null;
      }
      return null;
    };

    if (!isSupabaseLive()) {
      return allowLocalCatalog() ? getLocalProductBySlug(slug) || null : null;
    }
    try {
      const supabase = createStaticClient();
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
          product_variants(id, sku, title, price, attributes, stock_quantity)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching product by slug:', formatSupabaseError(error));
        return fromLkgOrLocal();
      }

      if (!data) return fromLkgOrLocal();

      const variants = (data.product_variants ?? []).map((v: any) => ({
        id: v.id,
        size: v.title,
        color: v.attributes?.color ?? 'Default',
        stock_quantity: typeof v.stock_quantity === 'number' ? v.stock_quantity : 0,
        price_override: v.price,
      }));

      const minPrice =
        variants.length > 0 ? Math.min(...variants.map((v: any) => v.price_override)) : 0;

      const membership = await fetchMembershipMap(supabase);
      const collections = resolveMembership(data.id, data.slug, membership.get(data.id) || []);

      return {
        id: data.id,
        name: data.title,
        slug: data.slug,
        price: minPrice,
        description: data.description ?? '',
        image_url: data.featured_image_url,
        category: collections[0] || '',
        collections,
        variants,
        metadata: data.metadata ?? {},
        is_active: data.status === 'active',
      };
    } catch (err) {
      console.error('Exception in getProductBySlug:', formatSupabaseError(err));
      return fromLkgOrLocal();
    }
  },
};

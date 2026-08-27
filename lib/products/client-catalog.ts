/**
 * Client-safe catalog loader for /collections.
 * Same policy as ProductQueries: live → LKG → local (flag only) → empty.
 * Never auto-demo in production.
 */

import {
  localMembershipFor,
  type CollectionSlug,
} from '@/lib/products/collections';
import type { CatalogProduct } from '@/lib/products/queries';
import { getLocalActiveProducts, LOCAL_PRODUCTS } from '@/lib/products/data';
import { allowLocalCatalog, allowLocalMembershipFallback, isSupabaseLive } from '@/lib/products/env';
import {
  logCatalogDegraded,
  readCatalogLkg,
  saveCatalogLkg,
} from '@/lib/products/catalog-cache';
import { resolveProductImages } from '@/lib/products/image-map';
import { displayProductName, withClientProductCopy } from '@/lib/products/copy';
import { isRemovedApparelSize } from '@/lib/products/sizes';

function mapLocal(): CatalogProduct[] {
  if (!allowLocalCatalog()) return [];
  return getLocalActiveProducts().map((p, i) => {
    const full = LOCAL_PRODUCTS.find((lp) => lp.id === p.id || lp.slug === p.slug);
    return {
      id: p.id,
      name: displayProductName(p.name),
      price: p.price,
      slug: p.slug,
      image: p.image,
      image2: full?.metadata.gallery_images?.[1],
      description: withClientProductCopy(p.slug, p.name, full?.description ?? ''),
      collections: localMembershipFor(p.id, p.slug),
      createdAt: Date.now() - i * 1000,
      variants: (full?.variants ?? [])
        .filter((v) => !isRemovedApparelSize(v.size))
        .map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price_override ?? p.price,
      })),
      metadata: full?.metadata as Record<string, unknown> | undefined,
    };
  });
}

function resolveFallback(reason: string): CatalogProduct[] {
  const lkg = readCatalogLkg();
  if (lkg) {
    logCatalogDegraded('lkg', `${reason}; ageMs=${lkg.ageMs}`);
    return lkg.products;
  }
  if (allowLocalCatalog()) {
    logCatalogDegraded('local', reason);
    return mapLocal();
  }
  logCatalogDegraded('empty', reason);
  return [];
}

function resolveMembership(productId: string, slug: string, fromDb: CollectionSlug[]): CollectionSlug[] {
  if (fromDb.length > 0) return fromDb;
  if (!allowLocalMembershipFallback()) return [];
  return localMembershipFor(productId, slug);
}

import { resolveStorefrontBrandId } from './brand';
import { isStreetPlayrCatalogMetadata } from '@/src/integrations/unicommerce/streetplayr-brand';

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

  if (!isStreetPlayrCatalogMetadata(meta)) return false;

  // 6. Variants/Inventory check (has at least one variant to prevent ghost listings)
  const variants = p.variants;
  if (!Array.isArray(variants) || variants.length === 0) return false;

  return true;
}

export async function loadClientCatalog(): Promise<CatalogProduct[]> {
  if (!isSupabaseLive()) return mapLocal().filter(isValidStorefrontProduct);

  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const brandId = await resolveStorefrontBrandId(supabase);

    const { data, error } = await supabase
      .from('products')
      .select(
        'id, title, slug, description, featured_image_url, metadata, status, created_at, product_variants(id, price, title, attributes)'
      )
      .eq('status', 'active')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const reason = error ? `products failed: ${error.message}` : 'products returned 0 rows';
      return resolveFallback(reason).filter(isValidStorefrontProduct);
    }

    const membership = new Map<string, CollectionSlug[]>();
    const { data: links, error: linkErr } = await supabase
      .from('collection_products')
      .select('product_id, collections!inner(slug, is_active)');

    if (linkErr) {
      console.warn('[catalog:client] collection_products failed:', linkErr.message);
    } else {
      for (const row of links || []) {
        const col = (row as any).collections;
        if (!col?.slug || col.is_active === false) continue;
        const slug = String(col.slug).toLowerCase() as CollectionSlug;
        const list = membership.get(row.product_id) || [];
        if (!list.includes(slug)) list.push(slug);
        membership.set(row.product_id, list);
      }
    }

    const mapped: CatalogProduct[] = data.map((p) => {
      const variants = (p.product_variants ?? [])
        .map((v: any) => ({
          id: v.id as string,
          size: (v.attributes?.size as string) || (v.title as string) || 'M',
          price: v.price as number | undefined,
        }))
        .filter((v: { size: string }) => !isRemovedApparelSize(v.size));
      const prices = variants.map((v) => v.price).filter(Boolean) as number[];
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const collections = resolveMembership(p.id, p.slug, membership.get(p.id) || []);
      if (collections.length === 0) {
        console.warn(
          `[catalog:client] "${p.slug}" has no collection membership — excluded from filters`
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

    const filtered = mapped.filter(isValidStorefrontProduct);

    if (!filtered.some((p) => p.collections.length > 0)) {
      console.warn(
        '[catalog:client] No collection membership resolved — returning unfiltered DB products'
      );
    }

    saveCatalogLkg(filtered);
    return filtered;
  } catch (err) {
    console.error('[catalog:client] exception:', err);
    return resolveFallback(`exception: ${err instanceof Error ? err.message : String(err)}`).filter(isValidStorefrontProduct);
  }
}

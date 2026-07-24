/**
 * Client-safe catalog loader for /collections.
 * Uses browser Supabase client (not createStaticClient).
 * Collection membership = collection_products, else local map by slug (never metadata guess).
 */

import {
  localMembershipFor,
  type CollectionSlug,
} from '@/lib/products/collections';
import type { CatalogProduct } from '@/lib/products/queries';
import { getLocalActiveProducts, LOCAL_PRODUCTS } from '@/lib/products/data';
import { allowLocalCatalog, isSupabaseLive } from '@/lib/products/env';

function mapLocal(): CatalogProduct[] {
  if (!allowLocalCatalog()) return [];
  return getLocalActiveProducts().map((p, i) => {
    const full = LOCAL_PRODUCTS.find((lp) => lp.id === p.id || lp.slug === p.slug);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      slug: p.slug,
      image: p.image,
      image2: full?.metadata.gallery_images?.[1],
      collections: localMembershipFor(p.id, p.slug),
      createdAt: Date.now() - i * 1000,
      metadata: full?.metadata as Record<string, unknown> | undefined,
    };
  });
}

export async function loadClientCatalog(): Promise<CatalogProduct[]> {
  if (!isSupabaseLive()) return mapLocal();

  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data, error } = await supabase
      .from('products')
      .select(
        'id, title, slug, featured_image_url, metadata, status, created_at, product_variants(id, price)'
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.warn('[catalog:client] products failed:', error.message);
      return mapLocal();
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
      const prices = (p.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      let collections = membership.get(p.id) || [];
      if (collections.length === 0) {
        collections = localMembershipFor(p.id, p.slug);
        if (collections.length === 0) {
          console.warn(
            `[catalog:client] "${p.slug}" has no collection membership — excluded from filters`
          );
        }
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
        metadata: p.metadata || {},
      };
    });

    // If DB returned products but ZERO collection links resolved, prefer local demo membership catalog
    const anyMembership = mapped.some((p) => p.collections.length > 0);
    if (!anyMembership) {
      console.warn('[catalog:client] No collection membership in DB — using local catalog SoT');
      return mapLocal();
    }

    return mapped;
  } catch (err) {
    console.error('[catalog:client] exception:', err);
    return mapLocal();
  }
}

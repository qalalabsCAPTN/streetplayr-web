'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import { getLocalLatestDrops } from '@/lib/products/data';
import { allowLocalCatalog } from '@/lib/products/env';
import BestSellersGate from "@/components/sections/home/BestSellersGate";

function localDropsRescue() {
  return allowLocalCatalog({ rescueEmpty: true }) ? getLocalLatestDrops() : [];
}

interface CMSBestSellerContent {
  schema_version?: string;
  heading?: string;
  collection_slug?: string;
  product_limit?: number;
  show_view_all?: boolean;
  cta_href?: string;
}

interface CMSBestSellerWrapperProps {
  content: CMSBestSellerContent;
}

interface DBProduct {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string;
  metadata?: {
    category?: string;
    gallery_images?: string[];
  };
  product_variants: Array<{ id: string; price: number }>;
}

// Client-safe helper to fetch latest drops directly using standard client-side Supabase
async function getClientLatestDrops() {
  try {
    const db = getSupabaseClient();
    const { data, error } = await db
      .from('products')
      .select(`
        id,
        title,
        slug,
        featured_image_url,
        metadata,
        status,
        product_variants(id, price)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) {
      return localDropsRescue();
    }

    const typedData = data as unknown as DBProduct[];
    return typedData.map((p) => {
      const prices = (p.product_variants ?? []).map((v) => v.price).filter(Boolean);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return {
        id: p.id,
        name: p.title,
        price: minPrice,
        image: p.featured_image_url,
        image2: p.metadata?.gallery_images?.[1] || p.featured_image_url,
        slug: p.slug,
        category: undefined,
      };
    });
  } catch (err) {
    console.warn('[CMSBestSellerWrapper] Fallback fetch failed, loading static data:', err);
    return localDropsRescue();
  }
}

export default function CMSBestSellerWrapper({ content }: CMSBestSellerWrapperProps) {
  const collectionSlug = content.collection_slug || "current-release";
  const productLimit = content.product_limit || 4;

  const { data: products, isLoading } = useQuery({
    queryKey: ['cms-collection-products', collectionSlug, productLimit],
    queryFn: async () => {
      try {
        const db = getSupabaseClient();

        // Resolve collection ID from slug
        const { data: collection, error: colError } = await db
          .from('collections')
          .select('id')
          .eq('slug', collectionSlug)
          .single();

        if (colError || !collection) {
          console.warn(`[CMSBestSellerWrapper] Collection not found for slug "${collectionSlug}". Falling back to latest drops.`);
          return getClientLatestDrops();
        }

        // Fetch linked product IDs
        const { data: colProducts, error: linkError } = await db
          .from('collection_products')
          .select('product_id')
          .eq('collection_id', collection.id);

        if (linkError || !colProducts || colProducts.length === 0) {
          console.warn(`[CMSBestSellerWrapper] No products linked to collection "${collectionSlug}". Falling back to latest drops.`);
          return getClientLatestDrops();
        }

        const typedColProducts = colProducts as unknown as Array<{ product_id: string }>;
        const productIds = typedColProducts.map((cp) => cp.product_id);

        // Query actual active products
        const { data, error } = await db
          .from('products')
          .select(`
            id,
            title,
            slug,
            featured_image_url,
            metadata,
            status,
            product_variants(id, price)
          `)
          .eq('status', 'active')
          .in('id', productIds)
          .limit(productLimit);

        if (error || !data || data.length === 0) {
          console.warn(`[CMSBestSellerWrapper] Error fetching products or empty set. Falling back to latest drops.`);
          return getClientLatestDrops();
        }

        const typedData = data as unknown as DBProduct[];
        return typedData.map((p) => {
          const prices = (p.product_variants ?? []).map((v) => v.price).filter(Boolean);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          return {
            id: p.id,
            name: p.title,
            price: minPrice,
            image: p.featured_image_url,
            image2: p.metadata?.gallery_images?.[1] || p.featured_image_url,
            slug: p.slug,
            category: undefined,
          };
        });
      } catch (err) {
        console.warn(`[CMSBestSellerWrapper] Query logic failed. Falling back to latest drops:`, err);
        return getClientLatestDrops();
      }
    },
    initialData: []
  });

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="h-8 w-8 border-2 border-nectar-400/30 border-t-nectar-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BestSellersGate
      products={products && products.length > 0 ? products : []}
    />
  );
}

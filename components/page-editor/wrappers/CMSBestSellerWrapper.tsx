'use client';

import { useQuery } from '@tanstack/react-query';
import BestSellersGate from '@/components/sections/home/BestSellersGate';
import { COLLECTION_SLUG } from '@/lib/products/collections';
import type { CatalogProduct } from '@/lib/products/queries';

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

function toGateProduct(p: CatalogProduct) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    image2: p.image2 || p.image,
    slug: p.slug,
    category: p.collections[0],
  };
}

/**
 * CMS bestsellers — same canonical client catalog as /collections + search.
 * Live → LKG → local(flag) → empty. No separate demo path.
 */
export default function CMSBestSellerWrapper({ content }: CMSBestSellerWrapperProps) {
  const collectionSlug = content.collection_slug || COLLECTION_SLUG.LATEST;
  const productLimit = content.product_limit || 4;

  const { data: products, isLoading } = useQuery({
    queryKey: ['cms-collection-products', collectionSlug, productLimit],
    queryFn: async () => {
      const { loadClientCatalog } = await import('@/lib/products/client-catalog');
      const catalog = await loadClientCatalog();
      const filtered =
        collectionSlug === 'ALL' || collectionSlug === 'all'
          ? catalog
          : catalog.filter((p) =>
              p.collections.some((c) => c.toLowerCase() === collectionSlug.toLowerCase())
            );
      const pool = filtered.length > 0 ? filtered : catalog;
      return pool.slice(0, productLimit).map(toGateProduct);
    },
    initialData: [],
  });

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="h-8 w-8 border-2 border-nectar-400/30 border-t-nectar-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BestSellersGate products={products && products.length > 0 ? products : []} />
  );
}

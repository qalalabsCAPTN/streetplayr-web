'use client';

import { useQuery } from '@tanstack/react-query';
import BestSellersRow from '@/components/sections/home/BestSellersRow';
import ProductSection from '@/components/ui/ProductSection';
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

function remapHeading(heading: string | undefined, slug: string): string {
  const h = (heading || '').trim();
  if (/^(pants|bottoms)$/i.test(h)) return 'Bottomwear';
  if (/^(t-?shirts?|tees)$/i.test(h)) return 'Topwear';
  if (/best.?seller/i.test(h)) return 'Best Sellers';
  if (h) return h;
  if (slug === COLLECTION_SLUG.PANTS) return 'Bottomwear';
  if (slug === COLLECTION_SLUG.TEES) return 'Topwear';
  return 'Collection';
}

function moreHrefForSlug(slug: string): string {
  if (slug === COLLECTION_SLUG.PANTS) return '/collections?category=bottomwear';
  if (slug === COLLECTION_SLUG.TEES) return '/collections?category=topwear';
  if (slug === COLLECTION_SLUG.TANKS) return '/collections?category=tanks';
  if (slug === COLLECTION_SLUG.LONG_SLEEVE) return '/collections?category=long-sleeve';
  return '/collections';
}

function isBestSellersBlock(content: CMSBestSellerContent, slug: string): boolean {
  return (
    /best.?seller/i.test(content.heading || '') ||
    slug === 'best-sellers' ||
    slug === 'bestsellers'
  );
}

function toSectionProduct(p: CatalogProduct) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    image2: p.image2 || p.image,
    slug: p.slug,
    category: p.collections[0],
    variants: p.variants,
  };
}

/**
 * CMS product carousel. Best-seller blocks hit the 15-day volume API.
 * Other collection_slug carousels keep catalog membership (not hijacked).
 */
export default function CMSBestSellerWrapper({ content }: CMSBestSellerWrapperProps) {
  const collectionSlug = content.collection_slug || COLLECTION_SLUG.LATEST;
  const productLimit = content.product_limit || 8;
  const bestSellers = isBestSellersBlock(content, collectionSlug);

  const { data: products, isLoading } = useQuery({
    queryKey: ['cms-product-carousel', collectionSlug, productLimit, bestSellers],
    queryFn: async () => {
      if (bestSellers) {
        const res = await fetch('/api/storefront/best-sellers', { cache: 'no-store' });
        if (res.ok) {
          const json = (await res.json()) as { products?: CatalogProduct[] };
          if (Array.isArray(json.products) && json.products.length > 0) {
            return json.products.slice(0, 3);
          }
        }
      }
      const { loadClientCatalog } = await import('@/lib/products/client-catalog');
      const catalog = await loadClientCatalog();
      const filtered =
        collectionSlug === 'ALL' || collectionSlug === 'all'
          ? catalog
          : catalog.filter((p) =>
              p.collections.some((c) => c.toLowerCase() === collectionSlug.toLowerCase())
            );
      const pool = filtered.length > 0 ? filtered : catalog;
      return pool.slice(0, bestSellers ? 3 : productLimit);
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

  const list = products && products.length > 0 ? products : [];
  if (list.length === 0) return null;

  if (bestSellers) {
    return <BestSellersRow products={list} />;
  }

  return (
    <ProductSection
      title={remapHeading(content.heading, collectionSlug)}
      products={list.map(toSectionProduct)}
      moreHref={content.cta_href || moreHrefForSlug(collectionSlug)}
      gallery
    />
  );
}

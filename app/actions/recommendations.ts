'use server';

import { ProductQueries } from '@/lib/products/queries';
import { recommendProducts } from '@/lib/products/recommend';

export async function getRecommendedProductsAction(currentSlug: string) {
  const catalog = await ProductQueries.getCatalogProducts();
  const related = recommendProducts(catalog, currentSlug, 4);
  return related.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    slug: p.slug,
    image: p.image,
    category: p.collections[0],
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      size: v.size,
      stockQuantity: v.stockQuantity,
    })),
  }));
}

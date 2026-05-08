import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

/**
 * Product Query Layer — centralized DB access with Next.js caching.
 */
export const ProductQueries = {
  /**
   * Fetches the latest arrivals/drops.
   */
  getLatestDrops: unstable_cache(
    async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('[Queries] NEXT_PUBLIC_SUPABASE_URL is missing. Skipping fetch.');
        return [];
      }
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          image_url,
          category:categories(name),
          slug,
          metadata
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching drops:', error);
        return [];
      }

      return data.map((p, idx) => ({
        id: p.id,
        name: p.name,
        price: `$${p.price}`,
        image: p.image_url,
        category: (p.category as any)?.name || 'Street',
        className: p.metadata?.className || getDefaultClassName(idx),
      }));
    },
    ['latest-drops'],
    { revalidate: 3600, tags: ['products', 'drops'] }
  ),

  /**
   * Fetches a single product by slug.
   */
  getProductBySlug: (slug: string) => unstable_cache(
    async (s: string) => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          description,
          image_url,
          slug,
          category:categories(name),
          variants:product_variants(id, color, size, stock_quantity, price_override),
          metadata
        `)
        .eq('slug', s)
        .single();

      if (error) return null;
      return data;
    },
    [`product-${slug}`],
    { revalidate: 3600, tags: ['products', `product-${slug}`] }
  )(slug),
};

/**
 * Editorial layout helper for the homepage grid.
 */
function getDefaultClassName(index: number) {
  const classes = [
    "md:col-span-5 md:mt-24", // Large left
    "md:col-span-3",          // Small middle
    "md:col-span-4 md:mt-48"  // Medium right
  ];
  return classes[index] || "";
}

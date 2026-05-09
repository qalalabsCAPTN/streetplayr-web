import { createClient } from '@/lib/supabase/server';

/**
 * Product Query Layer — centralized DB access.
 *
 * These functions call createClient() which reads cookies for auth context,
 * so they CANNOT be wrapped in unstable_cache (cookies() requires request
 * context and is not available during static generation).
 *
 * Caching is handled by Next.js at the page level via dynamic/static rendering.
 */
export const ProductQueries = {
  /**
   * Fetches the latest arrivals/drops.
   */
  async getLatestDrops() {
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
        slug,
        category:categories(name),
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
      slug: p.slug,
      category: (p.category as any)?.name || 'Street',
      className: p.metadata?.className || getDefaultClassName(idx),
    }));
  },

  /**
   * Fetches a single product by slug.
   */
  async getProductBySlug(slug: string) {
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
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  },
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

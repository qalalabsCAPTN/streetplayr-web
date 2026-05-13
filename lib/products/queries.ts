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
/**
 * Editorial feed item types shared with the client component.
 */
export interface FeedItemData {
  id: string;
  type: "product" | "campaign" | "typography";
  category: string;
  layoutType: "tall" | "square" | "landscape" | "full";
  slug?: string;
  title?: string;
  price?: string;
  image1?: string;
  image2?: string;
  metadata?: { drop: string; fabric: string };
  content?: string;
  image?: string;
}

/**
 * Editorial campaign/typography items (static — not product data).
 * These are brand content, not commerce data.
 */
const EDITORIAL_ITEMS: FeedItemData[] = [
  {
    id: "c1",
    type: "typography",
    category: "ALL",
    layoutType: "full",
    content: "STRIPPED OF EXCESS. DEFINED BY FORM. ARCHITECTURE FOR THE STREETS."
  },
  {
    id: "c3",
    type: "campaign",
    category: "ALL",
    layoutType: "full",
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=2000&auto=format&fit=crop",
    content: "STUDY IN FORM."
  },
  {
    id: "c2",
    type: "campaign",
    category: "ALL",
    layoutType: "full",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2000&auto=format&fit=crop"
  },
];

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
      price: p.price,
      image: p.image_url,
      slug: p.slug,
      category: (p.category as any)?.name || 'Street',
      className: p.metadata?.className || getDefaultClassName(idx),
    }));
  },

  /**
   * Fetches all active products for the collections feed.
   */
  async getActiveProducts() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
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
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active products:', error);
      return [];
    }

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      slug: p.slug,
      image: p.image_url,
      category: (p.category as any)?.name || 'Street',
    }));
  },

  /**
   * Fetches editorial feed data — merges active products with editorial content.
   * Products are transformed into FeedItemData for the editorial grid layout.
   * Falls back to static editorial items only when no products exist in DB.
   */
  async getEditorialFeed(): Promise<FeedItemData[]> {
    const products = await this.getActiveProducts();
    if (products.length === 0) return EDITORIAL_ITEMS;

    const productFeed: FeedItemData[] = products.map((p, i) => ({
      id: `p-${p.id}`,
      type: "product" as const,
      slug: p.slug,
      title: p.name,
      price: p.price ? `${p.price}` : undefined,
      image1: p.image || undefined,
      image2: p.image || undefined,
      category: p.category,
      metadata: { drop: "DROP", fabric: "PREMIUM" },
      layoutType: (["tall", "square", "landscape", "tall", "square", "tall"] as const)[i % 6],
    }));

    return [...productFeed, ...EDITORIAL_ITEMS];
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

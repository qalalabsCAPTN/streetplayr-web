import { createClient } from '@/lib/supabase/server';
import {
  getLocalProductBySlug,
  getLocalActiveProducts,
  getLocalLatestDrops,
} from '@/lib/products/data';

/**
 * Product Query Layer — centralized DB access.
 *
 * Falls back to local product data when Supabase is not configured.
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mockproject')) {
      return getLocalLatestDrops();
    }
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          featured_image_url,
          metadata,
          status,
          categories(name, slug),
          product_variants(id, price)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching drops:', error);
        return getLocalLatestDrops();
      }

      if (!data || data.length === 0) {
        return getLocalLatestDrops();
      }

      return data.map((p, idx) => {
        const prices = (p.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const categoryData = (p as any).categories;
        return {
          id: p.id,
          name: p.title,
          price: minPrice,
          image: p.featured_image_url,
          image2: p.metadata?.gallery_images?.[1] || p.featured_image_url,
          slug: p.slug,
          category: categoryData?.name || p.metadata?.category || 'Street',
          className: p.metadata?.className || getDefaultClassName(idx),
        };
      });
    } catch (err) {
      console.error('Exception in getLatestDrops:', err);
      return getLocalLatestDrops();
    }
  },

  /**
   * Fetches all active products for the collections feed.
   */
  async getActiveProducts() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mockproject')) {
      return getLocalActiveProducts();
    }
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          featured_image_url,
          metadata,
          status,
          categories(name, slug),
          product_variants(id, price)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active products:', error);
        return getLocalActiveProducts();
      }

      if (!data || data.length === 0) {
        return getLocalActiveProducts();
      }

      return data.map((p) => {
        const prices = (p.product_variants ?? []).map((v: any) => v.price).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const categoryData = (p as any).categories;
        return {
          id: p.id,
          name: p.title,
          price: minPrice,
          slug: p.slug,
          image: p.featured_image_url,
          category: categoryData?.name || p.metadata?.category || 'Street',
        };
      });
    } catch (err) {
      console.error('Exception in getActiveProducts:', err);
      return getLocalActiveProducts();
    }
  },

  /**
   * Fetches editorial feed data — merges active products with editorial content.
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('mockproject')) {
      return getLocalProductBySlug(slug) || null;
    }
    try {
      const supabase = await createClient();
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
          product_variants(id, sku, title, price, attributes)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error || !data) return getLocalProductBySlug(slug) || null;

      const variants = (data.product_variants ?? []).map((v: any) => ({
        id: v.id,
        size: v.title,
        color: v.attributes?.color ?? 'Default',
        stock_quantity: 999,
        price_override: v.price,
      }));

      const minPrice = variants.length > 0
        ? Math.min(...variants.map((v: any) => v.price_override))
        : 0;

      return {
        id: data.id,
        name: data.title,
        slug: data.slug,
        price: minPrice,
        description: data.description ?? '',
        image_url: data.featured_image_url,
        category: '',
        variants,
        metadata: data.metadata ?? {},
        is_active: data.status === 'active',
      };
    } catch (err) {
      console.error('Exception in getProductBySlug:', err);
      return getLocalProductBySlug(slug) || null;
    }
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

import { createStaticClient } from '@/lib/supabase/static';

let cachedBrandId: string | null = null;

/**
 * Resolves the active storefront brand ID dynamically from the brands table based on NEXT_PUBLIC_BRAND_ID env var.
 * Throws an error if the brand cannot be resolved.
 */
export async function resolveStorefrontBrandId(supabase?: any): Promise<string> {
  if (cachedBrandId) return cachedBrandId;

  const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
  const client = supabase || createStaticClient();

  const { data, error } = await client
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query brand dynamic ID: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error(`Failed to resolve dynamic brand ID: Brand record for slug "${brandSlug}" does not exist in the database.`);
  }

  cachedBrandId = data.id;
  return data.id;
}

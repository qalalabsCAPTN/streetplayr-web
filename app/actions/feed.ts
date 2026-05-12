'use server';

import { ProductQueries } from '@/lib/products/queries';

/**
 * Fetch editorial feed data server-side.
 * Product data is from Supabase. Editorial content is static.
 * Returns empty array in dev mode with no Supabase configured.
 */
export async function getEditorialFeedAction() {
  try {
    return await ProductQueries.getEditorialFeed();
  } catch {
    return [];
  }
}

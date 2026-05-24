import { createClient } from '@/lib/supabase/client';

// ============================================================
// getPageBlocks — server-side fetch of ordered visible blocks
// for a given site + page. Used by storefront page components.
// ============================================================

export type BlockType =
  | 'hero'
  | 'announcement_bar'
  | 'text_rich'
  | 'image_full'
  | 'image_grid'
  | 'cta_banner'
  | 'countdown_timer'
  | 'product_carousel'
  | 'collection_grid'
  | 'video_embed'
  | 'spacer'
  | 'divider';

export interface PageBlock {
  id: string;
  site_id: string;
  page_slug: string;
  block_type: BlockType;
  content: Record<string, unknown>;
  block_order: number;
  is_visible: boolean;
}

/** Fetch all visible blocks for a page, ordered. Returns [] on error. */
export async function getPageBlocks(
  pageSlug: string,
  siteSlug: string = 'streetplayr'
): Promise<PageBlock[]> {
  const supabase = createClient();

  // Resolve site UUID from slug
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', siteSlug)
    .single();

  if (!site) return [];

  const { data, error } = await supabase
    .from('page_blocks')
    .select('id, site_id, page_slug, block_type, content, block_order, is_visible')
    .eq('site_id', site.id)
    .eq('page_slug', pageSlug)
    .eq('is_visible', true)
    .order('block_order', { ascending: true });

  if (error) {
    console.error('[getPageBlocks]', error.message);
    return [];
  }

  return (data ?? []) as PageBlock[];
}

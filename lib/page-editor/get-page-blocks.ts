import { createStaticClient } from '@/lib/supabase/static';

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
  | 'divider'
  | 'brand_story'
  | 'lookbook'
  | 'reviews';

export interface PageBlock {
  id: string;
  site_id: string;
  page_slug: string;
  block_type: BlockType;
  content: Record<string, unknown>;
  block_order: number;
  is_visible: boolean;
}

/** Fetch all visible blocks for a page, ordered. Supports preview draft vs published content. */
export async function getPageBlocks(
  pageSlug: string,
  siteSlug: string = 'streetplayr',
  isPreview: boolean = false
): Promise<PageBlock[]> {
  try {
    const supabase = createStaticClient();

    // Resolve site UUID from slug
    const siteResult = await supabase
      .from('sites')
      .select('id')
      .eq('slug', siteSlug)
      .single() as unknown as { data: { id: string } | null; error: unknown };
    const site = siteResult.data;

    if (!site) return [];

    // Query both content and published_content to support robust preview fallback
    const blockResult = await supabase
      .from('page_blocks')
      .select('id, site_id, page_slug, block_type, content, published_content, block_order, is_visible')
      .eq('site_id', site.id)
      .eq('page_slug', pageSlug)
      .eq('is_visible', true)
      .order('block_order', { ascending: true }) as unknown as { data: unknown[] | null; error: unknown };
    const error = blockResult.error;
    const data = blockResult.data;

    if (error) {
      console.error('[getPageBlocks]', (error as { message?: string }).message ?? 'Unknown error');
      return [];
    }

    return (data ?? []).map((b: any) => {
      // Staging Preview serves content (draft); Production serves published_content (falling back to draft)
      const activeContent = isPreview
        ? b.content
        : (b.published_content ?? b.content ?? {});

      return {
        id: b.id,
        site_id: b.site_id,
        page_slug: b.page_slug,
        block_type: b.block_type,
        content: activeContent,
        block_order: b.block_order,
        is_visible: b.is_visible
      };
    }) as PageBlock[];
  } catch (err) {
    console.error('Exception in getPageBlocks:', err);
    return [];
  }
}

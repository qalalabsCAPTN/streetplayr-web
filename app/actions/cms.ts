'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/gateway';
import type { BlockType } from '@/lib/page-editor/get-page-blocks';

/** CMS writes — not viewer/support/fulfillment. */
const CMS_WRITE_ROLES: UserRole[] = ['super_admin', 'ops_admin', 'editorial'];

export type CmsSiteRow = {
  id: string;
  slug: string;
  name: string;
};

export type PageBlockRow = {
  id: string;
  site_id: string;
  page_slug: string;
  block_type: BlockType;
  content: Record<string, unknown>;
  block_order: number;
  is_visible: boolean;
};

export async function publishPageBlocksAction(
  siteId: string,
  pageSlug: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(CMS_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId || !pageSlug) {
    return { success: false, error: 'siteId and pageSlug are required' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc('publish_page_blocks', {
      p_site_id: siteId,
      p_page_slug: pageSlug,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Publish failed';
    return { success: false, error: message };
  }
}

export async function listSitesForCmsAction(): Promise<{
  success: boolean;
  error?: string;
  data?: CmsSiteRow[];
}> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sites')
      .select('id,slug,name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as CmsSiteRow[] };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list sites',
    };
  }
}

export async function listPageBlocksAction(
  siteId: string,
  pageSlug: string
): Promise<{ success: boolean; error?: string; data?: PageBlockRow[] }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId || !pageSlug) {
    return { success: false, error: 'siteId and pageSlug are required' };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('page_blocks')
      .select('id, site_id, page_slug, block_type, content, block_order, is_visible')
      .eq('site_id', siteId)
      .eq('page_slug', pageSlug)
      .order('block_order', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as PageBlockRow[] };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to list page blocks',
    };
  }
}

export async function reorderPageBlocksAction(
  siteId: string,
  pageSlug: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(CMS_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId || !pageSlug || !orderedIds.length) {
    return { success: false, error: 'siteId, pageSlug, and orderedIds are required' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc('reorder_page_blocks', {
      p_site_id: siteId,
      p_page_slug: pageSlug,
      p_block_ids: orderedIds,
    });

    if (error) {
      // Fallback: update block_order directly — fail closed on any row error
      for (let i = 0; i < orderedIds.length; i++) {
        const { error: updErr, count } = await admin
          .from('page_blocks')
          .update({ block_order: i }, { count: 'exact' })
          .eq('id', orderedIds[i])
          .eq('site_id', siteId)
          .eq('page_slug', pageSlug);
        if (updErr) return { success: false, error: updErr.message };
        if (count === 0) {
          return { success: false, error: `Block not found during reorder: ${orderedIds[i]}` };
        }
      }
    }

    return { success: true };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to reorder blocks',
    };
  }
}

export async function createPageBlockAction(payload: {
  siteId: string;
  pageSlug: string;
  blockType: BlockType;
  content?: Record<string, unknown>;
  blockOrder?: number;
}): Promise<{ success: boolean; error?: string; data?: PageBlockRow }> {
  const auth = await requireSSRRole(CMS_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  const { siteId, pageSlug, blockType } = payload;
  if (!siteId || !pageSlug || !blockType) {
    return { success: false, error: 'siteId, pageSlug, and blockType are required' };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('page_blocks')
      .insert({
        site_id: siteId,
        page_slug: pageSlug,
        block_type: blockType,
        content: payload.content ?? {},
        block_order: payload.blockOrder ?? 0,
        is_visible: true,
      })
      .select('id, site_id, page_slug, block_type, content, block_order, is_visible')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as PageBlockRow };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create block',
    };
  }
}

export async function updatePageBlockAction(
  blockId: string,
  updates: {
    content?: Record<string, unknown>;
    is_visible?: boolean;
    block_order?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(CMS_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!blockId) return { success: false, error: 'blockId is required' };

  try {
    const admin = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (updates.content !== undefined) patch.content = updates.content;
    if (updates.is_visible !== undefined) patch.is_visible = updates.is_visible;
    if (updates.block_order !== undefined) patch.block_order = updates.block_order;

    if (Object.keys(patch).length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    const { error } = await admin.from('page_blocks').update(patch).eq('id', blockId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to update block',
    };
  }
}

export async function deletePageBlockAction(
  blockId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(CMS_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!blockId) return { success: false, error: 'blockId is required' };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('page_blocks').delete().eq('id', blockId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to delete block',
    };
  }
}

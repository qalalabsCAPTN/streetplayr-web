'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/gateway';

/** Platform / site_access writes — not viewers or support. */
const PLATFORM_WRITE_ROLES: UserRole[] = ['super_admin', 'ops_admin'];

export type SiteRow = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  color: string | null;
  is_active: boolean;
};

export type SiteConfigRow = {
  site_id: string;
  earn_rate: number;
  redeem_rate: number;
  min_redeem_points: number;
  allow_cross_site_redeem: boolean;
};

/** Matches `site_access` in 00010_multi_site.sql — composite PK, no role column. */
export type SiteAccessRow = {
  user_id: string;
  site_id: string;
  granted_at: string | null;
  granted_by: string | null;
  profiles?: { email: string | null; full_name: string | null } | null;
  sites?: { slug: string; name: string } | null;
};

export async function listSitesAction(): Promise<{
  success: boolean;
  error?: string;
  data?: SiteRow[];
}> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sites')
      .select('id,slug,name,domain,color,is_active')
      .order('name', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as SiteRow[] };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to list sites' };
  }
}

export async function toggleSiteActiveAction(
  siteId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(PLATFORM_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId) return { success: false, error: 'siteId is required' };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('sites')
      .update({ is_active: isActive })
      .eq('id', siteId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to toggle site' };
  }
}

export async function createSiteAction(payload: {
  name: string;
  slug: string;
  domain?: string | null;
  color?: string | null;
}): Promise<{ success: boolean; error?: string; data?: SiteRow }> {
  const auth = await requireSSRRole(PLATFORM_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!payload.name?.trim() || !payload.slug?.trim()) {
    return { success: false, error: 'name and slug are required' };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sites')
      .insert({
        name: payload.name.trim(),
        slug: payload.slug.trim(),
        domain: payload.domain?.trim() || null,
        color: payload.color ?? '#6366F1',
        is_active: true,
      })
      .select('id,slug,name,domain,color,is_active')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as SiteRow };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to create site' };
  }
}

export async function getSiteConfigAction(
  siteId: string
): Promise<{ success: boolean; error?: string; data?: SiteConfigRow | null }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId) return { success: false, error: 'siteId is required' };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('site_configs')
      .select('site_id,earn_rate,redeem_rate,min_redeem_points,allow_cross_site_redeem')
      .eq('site_id', siteId)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as SiteConfigRow) ?? null };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to get site config' };
  }
}

export async function listSiteConfigsAction(): Promise<{
  success: boolean;
  error?: string;
  data?: SiteConfigRow[];
}> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('site_configs')
      .select('site_id,earn_rate,redeem_rate,min_redeem_points,allow_cross_site_redeem');

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as SiteConfigRow[] };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to list site configs' };
  }
}

export async function upsertSiteConfigAction(
  siteId: string,
  config: {
    earn_rate: number;
    redeem_rate: number;
    min_redeem_points: number;
    allow_cross_site_redeem: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(PLATFORM_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId) return { success: false, error: 'siteId is required' };

  const earn_rate = Number(config.earn_rate);
  const redeem_rate = Number(config.redeem_rate);
  const min_redeem_points = Number(config.min_redeem_points);
  if ([earn_rate, redeem_rate, min_redeem_points].some((n) => Number.isNaN(n))) {
    return { success: false, error: 'Invalid numeric config values' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('site_configs').upsert(
      {
        site_id: siteId,
        earn_rate,
        redeem_rate,
        min_redeem_points,
        allow_cross_site_redeem: Boolean(config.allow_cross_site_redeem),
      },
      { onConflict: 'site_id' }
    );

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to upsert site config' };
  }
}

export async function listSiteAccessAction(
  siteId?: string | null
): Promise<{ success: boolean; error?: string; data?: SiteAccessRow[] }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  try {
    const admin = createAdminClient();
    let query = admin
      .from('site_access')
      .select('user_id, site_id, granted_at, granted_by, profiles(email, full_name), sites(slug, name)')
      .order('granted_at', { ascending: false })
      .limit(100);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as unknown as SiteAccessRow[] };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to list site access' };
  }
}

export async function grantSiteAccessAction(
  siteId: string,
  email: string
): Promise<{ success: boolean; error?: string; data?: SiteAccessRow }> {
  const auth = await requireSSRRole(PLATFORM_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId || !email?.trim()) {
    return { success: false, error: 'siteId and email are required' };
  }

  try {
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (profileError) return { success: false, error: profileError.message };
    if (!profile) return { success: false, error: 'User not found for that email' };

    const { data, error } = await admin
      .from('site_access')
      .upsert(
        {
          user_id: profile.id,
          site_id: siteId,
          granted_by: auth.user.id,
          granted_at: new Date().toISOString(),
        },
        { onConflict: 'site_id,user_id' }
      )
      .select('user_id, site_id, granted_at, granted_by, profiles(email, full_name), sites(slug, name)')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as SiteAccessRow };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to grant access' };
  }
}

export async function revokeSiteAccessAction(
  siteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(PLATFORM_WRITE_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId || !userId) {
    return { success: false, error: 'siteId and userId are required' };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('site_access')
      .delete()
      .eq('site_id', siteId)
      .eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to revoke access' };
  }
}

export async function setActiveSiteAction(
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;

  if (!siteId) return { success: false, error: 'siteId is required' };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ active_site_id: siteId })
      .eq('id', auth.user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to set active site' };
  }
}

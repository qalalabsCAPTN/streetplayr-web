'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Save } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { cn } from '@/lib/ops2/cn';
import { getSupabaseClient } from '@/lib/ops2/supabase';

type SiteRow = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  color: string | null;
  is_active: boolean;
};

type SiteConfigRow = {
  site_id: string;
  earn_rate: number;
  redeem_rate: number;
  min_redeem_points: number;
  tier_multipliers: Record<string, number>;
};

type SiteAccessRow = {
  site_id: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
};

type OpsUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

const OPS_ROLES = ['super_admin', 'ops_admin', 'support', 'growth', 'finance', 'campaign_manager'];

const EMPTY_SITE = {
  slug: '',
  name: '',
  domain: '',
  color: '',
  is_active: true,
};

export default function SettingsPage() {
  const db = getSupabaseClient();
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [configs, setConfigs] = useState<SiteConfigRow[]>([]);
  const [accessRows, setAccessRows] = useState<SiteAccessRow[]>([]);
  const [opsUsers, setOpsUsers] = useState<OpsUserRow[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [newSite, setNewSite] = useState(EMPTY_SITE);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: siteData }, { data: configData }, { data: accessData }, { data: userData }] = await Promise.all([
      db.from('sites').select('id, slug, name, domain, color, is_active').order('created_at', { ascending: true }),
      db.from('site_configs').select('site_id, earn_rate, redeem_rate, min_redeem_points, tier_multipliers'),
      db.from('site_access').select('site_id, user_id, granted_by, granted_at').order('granted_at', { ascending: false }),
      db.from('profiles').select('id, email, full_name, role').in('role', OPS_ROLES),
    ]);

    const nextSites = (siteData ?? []) as SiteRow[];
    setSites(nextSites);
    setConfigs((configData ?? []) as SiteConfigRow[]);
    setAccessRows((accessData ?? []) as SiteAccessRow[]);
    setOpsUsers((userData ?? []) as OpsUserRow[]);
    setSelectedSiteId((current) => current || nextSites[0]?.id || '');
    setLoading(false);
  }

  function flash(msg: string) {
    setMessage(msg);
    window.clearTimeout((flash as unknown as { t?: number }).t);
    (flash as unknown as { t?: number }).t = window.setTimeout(() => setMessage(null), 2400);
  }

  const selectedConfig = useMemo(() => {
    return configs.find((config) => config.site_id === selectedSiteId) ?? null;
  }, [configs, selectedSiteId]);

  const grantedUsers = useMemo(() => {
    return new Set(accessRows.filter((row) => row.site_id === selectedSiteId).map((row) => row.user_id));
  }, [accessRows, selectedSiteId]);

  async function saveSite(site: SiteRow) {
    setSavingKey(`site-${site.id}`);
    await db
      .from('sites')
      .update({
        name: site.name,
        domain: site.domain || null,
        color: site.color || null,
        is_active: site.is_active,
      })
      .eq('id', site.id);
    setSavingKey(null);
    flash('Site saved');
    await loadAll();
  }

  async function addSite() {
    if (!newSite.slug.trim() || !newSite.name.trim()) return;
    setSavingKey('site-new');
    await db.from('sites').insert({
      slug: newSite.slug.trim(),
      name: newSite.name.trim(),
      domain: newSite.domain.trim() || null,
      color: newSite.color.trim() || null,
      is_active: newSite.is_active,
    });
    setNewSite(EMPTY_SITE);
    setSavingKey(null);
    flash('Site added');
    await loadAll();
  }

  async function saveConfig() {
    if (!selectedConfig) return;
    setSavingKey('config');
    await db.from('site_configs').upsert(selectedConfig);
    setSavingKey(null);
    flash('Site config saved');
    await loadAll();
  }

  async function toggleAccess(userId: string) {
    if (!selectedSiteId) return;
    setSavingKey(`access-${userId}`);
    if (grantedUsers.has(userId)) {
      await db.from('site_access').delete().eq('site_id', selectedSiteId).eq('user_id', userId);
      flash('Access revoked');
    } else {
      await db.from('site_access').insert({ site_id: selectedSiteId, user_id: userId });
      flash('Access granted');
    }
    setSavingKey(null);
    await loadAll();
  }

  function updateSite(id: string, patch: Partial<SiteRow>) {
    setSites((current) => current.map((site) => (site.id === id ? { ...site, ...patch } : site)));
  }

  function updateConfig(patch: Partial<SiteConfigRow>) {
    if (!selectedSiteId) return;
    setConfigs((current) => {
      const existing = current.find((config) => config.site_id === selectedSiteId);
      if (!existing) {
        return [
          ...current,
          {
            site_id: selectedSiteId,
            earn_rate: 1,
            redeem_rate: 0.01,
            min_redeem_points: 100,
            tier_multipliers: {},
            ...patch,
          },
        ];
      }
      return current.map((config) => (config.site_id === selectedSiteId ? { ...config, ...patch } : config));
    });
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Settings" />
      <div className="flex-1 pt-14 p-5 flex flex-col gap-5 min-h-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="page-title">Settings</h2>
            <p className="text-sm text-text-muted mt-0.5">Sites, configs, and access control</p>
          </div>
          {message && <div className="text-xs text-text-primary bg-base-elevated border border-border rounded-lg px-3 py-2">{message}</div>}
        </div>

        <Tabs.Root defaultValue="sites" className="flex-1 min-h-0 flex flex-col gap-4">
          <Tabs.List className="flex items-center gap-2 border-b border-border pb-3">
            {['sites', 'config', 'access'].map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className={cn(
                  'btn-ghost text-xs uppercase tracking-[0.18em]',
                  'data-[state=active]:bg-base-elevated data-[state=active]:text-text-primary'
                )}
              >
                {tab === 'sites' ? 'Sites' : tab === 'config' ? 'Site Config' : 'Access'}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="sites" className="flex-1 min-h-0 surface p-5 overflow-y-auto space-y-5">
            <div>
              <div className="section-title mb-3">Sites</div>
              <div className="space-y-3">
                {sites.map((site) => (
                  <div key={site.id} className="grid grid-cols-[1.2fr_1.2fr_1.2fr_0.8fr_auto] gap-3 items-center border border-border rounded-xl p-4 bg-base-elevated">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Slug</label>
                      <input className="field w-full" value={site.slug} disabled />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Name</label>
                      <input className="field w-full" value={site.name} onChange={(e) => updateSite(site.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Domain</label>
                      <input className="field w-full" value={site.domain ?? ''} onChange={(e) => updateSite(site.id, { domain: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Color</label>
                      <input className="field w-full" value={site.color ?? ''} onChange={(e) => updateSite(site.id, { color: e.target.value })} />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-xs text-text-muted pb-2">
                        <input type="checkbox" checked={site.is_active} onChange={(e) => updateSite(site.id, { is_active: e.target.checked })} />
                        Active
                      </label>
                      <button className="btn-primary text-xs gap-1.5" onClick={() => saveSite(site)} disabled={savingKey === `site-${site.id}`}>
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="section-title mb-3">Add Site</div>
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end border border-border rounded-xl p-4 bg-base-elevated">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Slug</label>
                  <input className="field w-full" value={newSite.slug} onChange={(e) => setNewSite((current) => ({ ...current, slug: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Name</label>
                  <input className="field w-full" value={newSite.name} onChange={(e) => setNewSite((current) => ({ ...current, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Domain</label>
                  <input className="field w-full" value={newSite.domain} onChange={(e) => setNewSite((current) => ({ ...current, domain: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Color</label>
                  <input className="field w-full" value={newSite.color} onChange={(e) => setNewSite((current) => ({ ...current, color: e.target.value }))} />
                </div>
                <button className="btn-primary text-xs gap-1.5" onClick={addSite} disabled={savingKey === 'site-new'}>
                  <Plus className="h-3.5 w-3.5" /> Add Site
                </button>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="config" className="flex-1 min-h-0 surface p-5 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <div className="section-title">Site Config</div>
              <select className="field w-64" value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)}>
                {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Earn Rate</label>
                <input className="field w-full" type="number" step="0.01" value={selectedConfig?.earn_rate ?? 1} onChange={(e) => updateConfig({ earn_rate: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Redeem Rate</label>
                <input className="field w-full" type="number" step="0.01" value={selectedConfig?.redeem_rate ?? 0.01} onChange={(e) => updateConfig({ redeem_rate: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Min Redeem Points</label>
                <input className="field w-full" type="number" value={selectedConfig?.min_redeem_points ?? 100} onChange={(e) => updateConfig({ min_redeem_points: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Tier Multipliers (JSON)</label>
              <textarea
                className="field w-full min-h-40 font-mono text-sm"
                value={JSON.stringify(selectedConfig?.tier_multipliers ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateConfig({ tier_multipliers: JSON.parse(e.target.value) });
                  } catch {}
                }}
              />
            </div>
            <div>
              <button className="btn-primary text-xs gap-1.5" onClick={saveConfig} disabled={savingKey === 'config' || !selectedSiteId}>
                <Save className="h-3.5 w-3.5" /> Save Config
              </button>
            </div>
          </Tabs.Content>

          <Tabs.Content value="access" className="flex-1 min-h-0 surface p-5 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <div className="section-title">Site Access</div>
              <select className="field w-64" value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)}>
                {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {opsUsers.map((user) => {
                const hasAccess = grantedUsers.has(user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between border border-border rounded-xl p-4 bg-base-elevated">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{user.full_name || user.email || user.id}</div>
                      <div className="text-xs text-text-muted mt-1">{user.email || '—'} · {user.role || 'member'}</div>
                    </div>
                    <button className={cn('text-xs gap-1.5', hasAccess ? 'btn-ghost' : 'btn-primary')} onClick={() => toggleAccess(user.id)} disabled={savingKey === `access-${user.id}`}>
                      {hasAccess ? 'Revoke' : 'Grant'} Access
                    </button>
                  </div>
                );
              })}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}

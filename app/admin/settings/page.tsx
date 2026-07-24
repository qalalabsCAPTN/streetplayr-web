'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Plus, Save } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { cn } from '@/lib/ops2/cn';
import {
  listSitesAction,
  toggleSiteActiveAction,
  createSiteAction,
  listSiteConfigsAction,
  upsertSiteConfigAction,
  listSiteAccessAction,
  grantSiteAccessAction,
  revokeSiteAccessAction,
  type SiteRow,
  type SiteConfigRow,
  type SiteAccessRow,
} from '@/app/actions/ops/admin-settings';

type AccessRow = SiteAccessRow;

// ── helpers ──────────────────────────────────────────────────────────────────

const FIELD = 'w-full px-3 py-2 rounded-lg bg-base-overlay border border-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-nectar-400';
const BTN   = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors';

// ── Sites tab ─────────────────────────────────────────────────────────────────

function SitesTab() {
  const [sites, setSites]     = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [adding, setAdding]   = useState(false);
  const [draft, setDraft]     = useState({ slug: '', name: '', domain: '', color: '#6366F1' });

  useEffect(() => {
    listSitesAction().then((res) => {
      if (res.success && res.data) setSites(res.data);
      setLoading(false);
    });
  }, []);

  async function toggleActive(site: SiteRow) {
    setSaving(site.id);
    const next = !site.is_active;
    const res = await toggleSiteActiveAction(site.id, next);
    if (res.success) {
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, is_active: next } : s));
    }
    setSaving(null);
  }

  async function addSite() {
    if (!draft.slug || !draft.name) return;
    setSaving('new');
    const res = await createSiteAction({
      slug: draft.slug,
      name: draft.name,
      domain: draft.domain || null,
      color: draft.color,
    });
    if (res.success && res.data) {
      setSites(prev => [...prev, res.data!]);
      setDraft({ slug: '', name: '', domain: '', color: '#6366F1' });
      setAdding(false);
    }
    setSaving(null);
  }

  if (loading) return <div className="p-6 text-text-muted text-sm animate-pulse">Loading sites…</div>;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Connected Sites</h3>
        <button onClick={() => setAdding(v => !v)} className={cn(BTN, 'bg-nectar-400/10 text-nectar-400 hover:bg-nectar-400/20')}>
          <Plus className="h-3.5 w-3.5" /> Add Site
        </button>
      </div>

      {adding && (
        <div className="surface p-4 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">New Site</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Slug *</label>
              <input className={FIELD} placeholder="e.g. playr" value={draft.slug} onChange={e => setDraft(p => ({ ...p, slug: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Name *</label>
              <input className={FIELD} placeholder="e.g. Playr Store" value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Domain</label>
              <input className={FIELD} placeholder="playr.store" value={draft.domain} onChange={e => setDraft(p => ({ ...p, domain: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Brand Colour</label>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.color} onChange={e => setDraft(p => ({ ...p, color: e.target.value }))} className="h-9 w-12 rounded cursor-pointer border border-border bg-base-overlay" />
                <span className="text-xs text-text-muted font-mono">{draft.color}</span>
              </div>
            </div>
          </div>
          <button onClick={addSite} disabled={saving === 'new'} className={cn(BTN, 'bg-nectar-400 text-black hover:bg-nectar-300 self-end')}>
            <Save className="h-3.5 w-3.5" /> {saving === 'new' ? 'Saving…' : 'Save Site'}
          </button>
        </div>
      )}

      <div className="surface overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Name</th>
              <th>Domain</th>
              <th>Colour</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {sites.map(site => (
              <tr key={site.id}>
                <td><span className="font-mono text-xs text-text-secondary">{site.slug}</span></td>
                <td className="font-medium text-text-primary">{site.name}</td>
                <td className="text-text-muted text-xs">{site.domain ?? '—'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: site.color ?? '#6366F1' }} />
                    <span className="font-mono text-xs text-text-muted">{site.color ?? '—'}</span>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(site)}
                    disabled={saving === site.id}
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
                      site.is_active
                        ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-base-elevated text-text-muted border-border hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
                    )}
                  >
                    {saving === site.id ? '…' : site.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Site Config tab ───────────────────────────────────────────────────────────

function SiteConfigTab() {
  const [sites, setSites]   = useState<SiteRow[]>([]);
  const [configs, setConfigs] = useState<Record<string, SiteConfigRow>>({});
  const [selected, setSelected] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    Promise.all([listSitesAction(), listSiteConfigsAction()]).then(([sitesRes, cfgRes]) => {
      const siteList = (sitesRes.data ?? []).filter(s => s.is_active);
      setSites(siteList);
      if (siteList[0]) setSelected(siteList[0].id);
      const cfgMap: Record<string, SiteConfigRow> = {};
      for (const row of cfgRes.data ?? []) cfgMap[row.site_id] = row;
      setConfigs(cfgMap);
    });
  }, []);

  const cfg = useMemo<SiteConfigRow>(() => configs[selected] ?? {
    site_id: selected,
    earn_rate: 10,
    redeem_rate: 100,
    min_redeem_points: 500,
    allow_cross_site_redeem: true,
  }, [configs, selected]);

  function patch(field: keyof SiteConfigRow, value: unknown) {
    setConfigs(prev => ({ ...prev, [selected]: { ...cfg, [field]: value } }));
  }

  async function save() {
    setSaving(true);
    const res = await upsertSiteConfigAction(selected, {
      earn_rate: cfg.earn_rate,
      redeem_rate: cfg.redeem_rate,
      min_redeem_points: cfg.min_redeem_points,
      allow_cross_site_redeem: cfg.allow_cross_site_redeem,
    });
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-text-primary">Site Config</h3>
        <select
          className={cn(FIELD, 'w-auto')}
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selected && (
        <div className="surface p-5 flex flex-col gap-5 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Earn Rate (pts / ₹)</label>
              <input type="number" className={FIELD} value={cfg.earn_rate} onChange={e => patch('earn_rate', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Redeem Rate (pts / ₹)</label>
              <input type="number" className={FIELD} value={cfg.redeem_rate} onChange={e => patch('redeem_rate', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Min Redeem Points</label>
              <input type="number" className={FIELD} value={cfg.min_redeem_points} onChange={e => patch('min_redeem_points', Number(e.target.value))} />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.allow_cross_site_redeem}
                  onChange={e => patch('allow_cross_site_redeem', e.target.checked)}
                  className="rounded border-border bg-base-overlay text-nectar-400"
                />
                <span className="text-sm text-text-secondary">Allow cross-site redeem</span>
              </label>
            </div>
          </div>

          <button onClick={save} disabled={saving} className={cn(BTN, 'bg-nectar-400 text-black hover:bg-nectar-300 self-start')}>
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Config'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Access tab ────────────────────────────────────────────────────────────────

function AccessTab() {
  const [rows, setRows]       = useState<AccessRow[]>([]);
  const [sites, setSites]     = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail]     = useState('');
  const [siteSlug, setSiteSlug] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listSiteAccessAction(), listSitesAction()])
      .then(([accessRes, sitesRes]) => {
        if (accessRes.success && accessRes.data) setRows(accessRes.data);
        else if (!accessRes.success) setError(accessRes.error ?? 'Failed to load access');
        if (sitesRes.success && sitesRes.data) setSites(sitesRes.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load access');
        setLoading(false);
      });
  }, []);

  async function grant() {
    if (!email || !siteSlug) return;
    setSaving(true);
    setError(null);
    const site = sites.find(s => s.slug === siteSlug);
    if (!site) {
      setError('Unknown site slug');
      setSaving(false);
      return;
    }
    const res = await grantSiteAccessAction(site.id, email);
    if (res.success && res.data) {
      setRows(prev => [
        res.data!,
        ...prev.filter(r => !(r.user_id === res.data!.user_id && r.site_id === res.data!.site_id)),
      ]);
      setEmail('');
      setSiteSlug('');
    } else {
      setError(res.error ?? 'Grant failed');
    }
    setSaving(false);
  }

  async function revoke(siteId: string, userId: string) {
    setError(null);
    const res = await revokeSiteAccessAction(siteId, userId);
    if (res.success) {
      setRows(prev => prev.filter(r => !(r.site_id === siteId && r.user_id === userId)));
    } else {
      setError(res.error ?? 'Revoke failed');
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="surface p-4 flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Grant Access</h4>
        <p className="text-xs text-text-muted">
          Grants site membership only. Global ops role lives on the user profile, not here.
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">User Email</label>
            <input className={FIELD} placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Site Slug</label>
            <input className={FIELD} placeholder="streetplayr" value={siteSlug} onChange={e => setSiteSlug(e.target.value)} />
          </div>
        </div>
        <button onClick={grant} disabled={saving || !email || !siteSlug} className={cn(BTN, 'bg-nectar-400 text-black hover:bg-nectar-300 self-start disabled:opacity-40')}>
          <Plus className="h-3.5 w-3.5" /> {saving ? 'Granting…' : 'Grant Access'}
        </button>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm animate-pulse">Loading access list…</div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Site</th>
                <th>Granted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-text-muted py-8 text-sm">No access entries</td></tr>
              ) : rows.map(row => (
                <tr key={`${row.site_id}:${row.user_id}`}>
                  <td>
                    <div className="text-sm text-text-primary">{row.profiles?.full_name ?? '—'}</div>
                    <div className="text-xs text-text-muted">{row.profiles?.email ?? row.user_id.slice(0, 8) + '…'}</div>
                  </td>
                  <td><span className="font-mono text-xs text-text-secondary">{row.sites?.slug ?? '—'}</span></td>
                  <td className="text-xs text-text-muted">
                    {row.granted_at ? new Date(row.granted_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => revoke(row.site_id, row.user_id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'sites',   label: 'Sites' },
  { id: 'config',  label: 'Site Config' },
  { id: 'access',  label: 'Access' },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Settings" />
      <div className="flex-1 pt-14 p-5 flex flex-col gap-5 min-h-0 overflow-y-auto">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage sites, reward configs, and team access.</p>
        </div>

        <Tabs.Root defaultValue="sites" className="flex flex-col gap-0">
          <Tabs.List className="flex border-b border-border gap-1 mb-0">
            {TABS.map(t => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className="px-4 py-2.5 text-sm font-medium text-text-muted border-b-2 border-transparent -mb-px transition-colors data-[state=active]:text-text-primary data-[state=active]:border-nectar-400"
              >
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="surface rounded-t-none">
            <Tabs.Content value="sites"><SitesTab /></Tabs.Content>
            <Tabs.Content value="config"><SiteConfigTab /></Tabs.Content>
            <Tabs.Content value="access"><AccessTab /></Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  );
}

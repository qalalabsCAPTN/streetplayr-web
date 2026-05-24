'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import {
  Zap, Play, Pause, Clock, CheckCircle2, Archive,
  Users, Coins, TrendingUp, Plus, ChevronRight,
  Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';

// ─── Types (aligned with bonus_campaigns DB schema) ──────────────────────────

interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  sprr_reward: number;
  xp_reward: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreateCampaignModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sprrReward, setSprrReward] = useState(0);
  const [xpReward, setXpReward] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/nectar/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, sprrReward, xpReward, isActive: false }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Create failed'); return; }
      onCreated(data.campaign);
      onClose();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="surface w-full max-w-md p-6 rounded-xl space-y-4">
        <h3 className="text-base font-semibold text-text-primary">New Campaign</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-nectar-400/60"
              placeholder="Summer Double Points"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-nectar-400/60 resize-none"
              placeholder="Optional campaign description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">SP-RR Reward</label>
              <input
                type="number"
                min={0}
                value={sprrReward}
                onChange={e => setSprrReward(Number(e.target.value))}
                className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-nectar-400/60"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">XP Reward</label>
              <input
                type="number"
                min={0}
                value={xpReward}
                onChange={e => setXpReward(Number(e.target.value))}
                className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-nectar-400/60"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-status-error">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="btn-primary text-sm inline-flex items-center gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  onToggle,
}: {
  campaign: Campaign;
  onToggle: (id: string, active: boolean) => void;
}) {
  const isActive = campaign.is_active;
  const hasExpiry = !!campaign.ends_at;
  const isExpired = hasExpiry && new Date(campaign.ends_at!) < new Date();

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }

  return (
    <div className="surface rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{campaign.name}</h3>
          {campaign.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{campaign.description}</p>
          )}
        </div>
        <Badge variant={isExpired ? 'muted' : isActive ? 'success' : 'muted'}>
          {isExpired ? <Archive className="h-3 w-3 mr-1" /> : isActive ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
          {isExpired ? 'Expired' : isActive ? 'Active' : 'Paused'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {campaign.sprr_reward > 0 && (
          <div className="rounded-lg bg-base-overlay px-3 py-2">
            <div className="text-xs text-text-muted mb-0.5">SP-RR Reward</div>
            <div className="text-base font-semibold text-nectar-300">{fmt(campaign.sprr_reward)}</div>
          </div>
        )}
        {campaign.xp_reward > 0 && (
          <div className="rounded-lg bg-base-overlay px-3 py-2">
            <div className="text-xs text-text-muted mb-0.5">XP Reward</div>
            <div className="text-base font-semibold text-status-success">{fmt(campaign.xp_reward)}</div>
          </div>
        )}
      </div>

      {(campaign.starts_at || campaign.ends_at) && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3 w-3" />
          {campaign.starts_at && <span>From {new Date(campaign.starts_at).toLocaleDateString()}</span>}
          {campaign.ends_at && <span>Until {new Date(campaign.ends_at).toLocaleDateString()}</span>}
        </div>
      )}

      {!isExpired && (
        <button
          onClick={() => onToggle(campaign.id, !isActive)}
          className={cn(
            'w-full text-xs font-medium rounded-lg py-2 transition-colors',
            isActive
              ? 'bg-status-error/10 text-status-error hover:bg-status-error/20'
              : 'bg-status-success/10 text-status-success hover:bg-status-success/20'
          )}
        >
          {isActive ? 'Pause Campaign' : 'Activate Campaign'}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/nectar/campaigns');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Load failed');
      setCampaigns(data.campaigns);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(id: string, active: boolean) {
    try {
      await fetch('/api/admin/nectar/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: active }),
      });
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: active } : c));
    } catch {
      setError('Toggle failed');
    }
  }

  const activeCampaigns = campaigns.filter(c => c.is_active && (!c.ends_at || new Date(c.ends_at) > new Date()));
  const inactiveCampaigns = campaigns.filter(c => !c.is_active || (c.ends_at && new Date(c.ends_at) <= new Date()));

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Campaigns" />

      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-nectar-400" />
              </div>
              <div>
                <h2 className="page-title">Campaign Orchestration</h2>
                <p className="text-sm text-text-muted mt-0.5">Live from DB · bonus_campaigns table</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="btn-ghost p-2" title="Refresh">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                New Campaign
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="metric-card">
              <div className="metric-label">Total Campaigns</div>
              <div className="metric-value">{campaigns.length}</div>
              <div className="metric-subtext">in database</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active</div>
              <div className="metric-value text-status-success">{activeCampaigns.length}</div>
              <div className="metric-subtext">live now</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total SP-RR in Campaigns</div>
              <div className="metric-value text-nectar-300">
                {campaigns.reduce((s, c) => s + c.sprr_reward, 0).toLocaleString()}
              </div>
              <div className="metric-subtext">available to earn</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-nectar-400" />
            </div>
          )}

          {/* Active campaigns */}
          {!loading && activeCampaigns.length > 0 && (
            <div>
              <div className="section-title text-status-success mb-3">Active</div>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {activeCampaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive campaigns */}
          {!loading && inactiveCampaigns.length > 0 && (
            <div>
              <div className="section-title text-text-muted mb-3">Paused / Expired</div>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {inactiveCampaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && campaigns.length === 0 && !error && (
            <div className="text-center py-16 text-text-muted">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No campaigns yet</p>
              <p className="text-xs mt-1 opacity-60">Create your first campaign to start rewarding customers</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-sm inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Campaign
              </button>
            </div>
          )}

        </div>
      </div>

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={c => setCampaigns(prev => [c, ...prev])}
        />
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import { Badge } from '@/components/ops2/ui/badge';
import { EmptyState } from '@/components/ops2/ui/empty-state';
import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  TicketPercent,
} from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import {
  createCouponAction,
  listCouponAnalyticsAction,
  setCouponActiveAction,
} from '@/app/actions/admin/coupons';
import type { CouponDraft, CouponUtilization } from '@/lib/commerce/coupons';

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function CreateCouponModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<CouponDraft['kind']>('percent');
  const [value, setValue] = useState('10');
  const [minSubtotal, setMinSubtotal] = useState('0');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [maxPerUser, setMaxPerUser] = useState('1');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setLoading(true);
    setError('');
    const result = await createCouponAction({
      code,
      kind,
      value: Number(value),
      min_subtotal: Number(minSubtotal || 0),
      max_redemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
      max_per_user: maxPerUser.trim() ? Number(maxPerUser) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_active: isActive,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="surface w-full max-w-lg p-6 rounded-xl space-y-4 max-h-[92vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-text-primary">New coupon</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-nectar-400/60 font-mono"
              placeholder="PLAYR10"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Type *</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as CouponDraft['kind'])}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed ₹ off</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">
              {kind === 'percent' ? 'Percent *' : 'Amount (₹) *'}
            </label>
            <input
              type="number"
              min={1}
              max={kind === 'percent' ? 100 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Min cart (₹)</label>
            <input
              type="number"
              min={0}
              value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Max uses (all)</label>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Max per customer</label>
            <input
              type="number"
              min={1}
              value={maxPerUser}
              onChange={(e) => setMaxPerUser(e.target.value)}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Starts</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Ends</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full bg-base-overlay border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active immediately
          </label>
        </div>
        {error ? <p className="text-sm text-status-error">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn-primary text-sm" onClick={handleCreate} disabled={loading}>
            {loading ? 'Saving…' : 'Create coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponUtilization[]>([]);
  const [totals, setTotals] = useState({ coupons: 0, active: 0, redemptions: 0, discountTotal: 0 });
  const [recent, setRecent] = useState<
    Array<{ id: string; code: string; amount: number; userId: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await listCouponAnalyticsAction();
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCoupons(result.data.coupons);
    setTotals(result.data.totals);
    setRecent(result.data.recent);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(coupon: CouponUtilization) {
    const result = await setCouponActiveAction(coupon.id, !coupon.is_active);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: result.data.is_active } : c))
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Coupons" />
      <div className="flex-1 pt-14 overflow-y-auto">
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
                <TicketPercent className="h-5 w-5 text-nectar-400" />
              </div>
              <div>
                <h2 className="page-title">Coupons</h2>
                <p className="text-sm text-text-muted mt-0.5">
                  Create checkout promo codes and track how much they are used
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void load()} className="btn-ghost p-2" title="Refresh">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                New coupon
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="metric-card">
              <div className="metric-label">Coupons</div>
              <div className="metric-value">{totals.coupons}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active</div>
              <div className="metric-value text-status-success">{totals.active}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Redemptions</div>
              <div className="metric-value">{totals.redemptions.toLocaleString('en-IN')}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Discount given</div>
              <div className="metric-value text-nectar-300">{inr(totals.discountTotal)}</div>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-nectar-400" />
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Offer</th>
                    <th>Uses</th>
                    <th>Customers</th>
                    <th>Discount given</th>
                    <th>Utilization</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          title="No coupons yet"
                          description="Create a code like PLAYR10. Shoppers apply it on checkout."
                        />
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.id}>
                        <td className="font-mono text-sm text-text-primary">{c.code}</td>
                        <td className="text-sm text-text-secondary">
                          {c.kind === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`}
                          {c.min_subtotal > 0 ? ` · min ${inr(c.min_subtotal)}` : ''}
                        </td>
                        <td className="text-sm">
                          {c.redemptions}
                          {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ''}
                        </td>
                        <td className="text-sm">{c.uniqueUsers}</td>
                        <td className="text-sm">{inr(c.discountTotal)}</td>
                        <td className="text-sm text-text-muted">
                          {c.utilizationPct == null ? 'Unlimited' : `${c.utilizationPct}%`}
                        </td>
                        <td>
                          <Badge variant={c.is_active ? 'success' : 'muted'}>
                            {c.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-ghost text-xs"
                            onClick={() => void toggle(c)}
                          >
                            {c.is_active ? 'Pause' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && recent.length > 0 ? (
            <div className="surface overflow-hidden">
              <div className="px-4 py-3 section-title">Recent redemptions</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Customer</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono text-xs">{row.code}</td>
                      <td>{inr(row.amount)}</td>
                      <td className="font-mono text-[10px] text-text-muted">{row.userId.slice(0, 8)}</td>
                      <td className="text-text-muted text-xs">
                        {new Date(row.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
      {showCreate ? <CreateCouponModal onClose={() => setShowCreate(false)} onCreated={() => void load()} /> : null}
    </div>
  );
}

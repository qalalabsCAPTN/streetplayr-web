'use client';

import { GitBranch, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, converted: 0, pending: 0, earnedSprr: 0 });
  const [edges, setEdges] = useState<{ referredUserId: string; createdAt: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { getLoyaltySnapshotAction } = await import('@/app/actions/loyalty');
      const result = await getLoyaltySnapshotAction();
      if (result.success) {
        setCode(result.data.referralCode);
        setStats(result.data.referralStats);
        setEdges(result.data.referralEdges);
      }
      setLoaded(true);
    })();
  }, []);

  const link = code ? `https://streetplayr.com/create-account?ref=${encodeURIComponent(code)}` : '';

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="h-8 w-8 text-nectar-400" />
        <div>
          <h1 className="text-3xl font-black text-text-primary">Referrals</h1>
          <p className="text-sm text-text-muted">Live StreetPlayR referral code and claims</p>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <div className="text-xs uppercase tracking-wider text-text-muted">Your code</div>
        <div className="text-2xl font-black">{loaded ? (code || 'No code on profile yet') : 'Loading…'}</div>
        {link && (
          <button type="button" className="flex items-center gap-2 text-sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy invite link'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-xs text-text-muted">Total</div><div className="text-xl font-black">{stats.total}</div></div>
        <div className="card p-4"><div className="text-xs text-text-muted">Converted</div><div className="text-xl font-black">{stats.converted}</div></div>
        <div className="card p-4"><div className="text-xs text-text-muted">Pending</div><div className="text-xl font-black">{stats.pending}</div></div>
        <div className="card p-4"><div className="text-xs text-text-muted">Earned SPRR</div><div className="text-xl font-black">{stats.earnedSprr}</div></div>
      </div>

      <div className="card divide-y divide-border-subtle">
        {edges.length === 0 && loaded && (
          <div className="p-6 text-sm text-text-muted">No referrals recorded yet.</div>
        )}
        {edges.map((e) => (
          <div key={`${e.referredUserId}-${e.createdAt}`} className="px-5 py-4 text-sm">
            <span className="font-mono text-xs">{e.referredUserId.slice(0, 8)}…</span>
            <span className="text-text-muted ml-3">{new Date(e.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

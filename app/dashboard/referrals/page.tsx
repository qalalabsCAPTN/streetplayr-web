'use client';

import { GitBranch, Copy, Users, TrendingUp, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/nectar-portal/cn';

const REFERRAL_CODE = 'RAHUL-NECTAR-K4X9';
const REFERRAL_LINK = 'https://nectar.playr.com/r/RAHUL-NECTAR-K4X9';

const MY_REFERRALS = [
  { name: 'Priya K.',   status: 'converted', pts: 2000, joinedAt: '2026-05-11', platform: 'streetplayr' },
  { name: 'Arjun V.',   status: 'converted', pts: 1500, joinedAt: '2026-05-07', platform: 'playr' },
  { name: 'Sneha M.',   status: 'signed_up', pts: 0,    joinedAt: '2026-05-04', platform: 'streetplayr' },
  { name: 'Rohit P.',   status: 'converted', pts: 2000, joinedAt: '2026-04-28', platform: 'playr_club' },
  { name: 'Divya S.',   status: 'converted', pts: 2000, joinedAt: '2026-04-10', platform: 'streetplayr' },
  { name: 'Kiran B.',   status: 'converted', pts: 2000, joinedAt: '2026-03-22', platform: 'playr' },
  { name: 'Neha G.',    status: 'signed_up', pts: 0,    joinedAt: '2026-03-15', platform: 'streetplayr' },
];

const STATUS_CONFIG = {
  converted: { label: 'Converted', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  signed_up: { label: 'Signed up', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
};

const PLATFORM_COLORS: Record<string, string> = {
  streetplayr: '#EF4444', playr: '#8B5CF6', playr_club: '#06B6D4', playr_game: '#F97316',
};

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const converted = MY_REFERRALS.filter(r => r.status === 'converted').length;
  const totalEarned = MY_REFERRALS.filter(r => r.status === 'converted').reduce((s, r) => s + r.pts, 0);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3 animate-fade-up">
        <GitBranch className="h-8 w-8 text-nectar-400" />
        <div>
          <h1 className="text-3xl font-black text-text-primary">Referrals</h1>
          <p className="text-sm text-text-muted">Share your link · earn on every purchase your referrals make</p>
        </div>
      </div>

      {/* Referral link hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 animate-fade-up"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, transparent 60%)', border: '1px solid rgba(16,185,129,0.20)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 50%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />
        <div className="relative space-y-6">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Your referral code</div>
            <div className="text-3xl font-black text-text-primary font-mono tracking-widest">{REFERRAL_CODE}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-base-elevated border border-border px-4 py-2.5 text-sm font-mono text-text-secondary">
              {REFERRAL_LINK}
            </div>
            <button
              onClick={handleCopy}
              className={cn('btn-nectar flex items-center gap-2 transition-all', copied && 'bg-status-success/20 text-status-success border-status-success/30')}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="text-status-success font-bold">+2,000 pts</span>
            per successful referral
            <span className="text-border mx-1">·</span>
            <span className="text-nectar-400 font-bold">2× bonus</span>
            during Referral Blitz
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="card p-5">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Referrals</div>
          <div className="text-3xl font-black text-text-primary">{MY_REFERRALS.length}</div>
          <div className="text-xs text-text-muted">{converted} converted</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Points Earned</div>
          <div className="text-3xl font-black text-nectar-400">{totalEarned.toLocaleString()}</div>
          <div className="text-xs text-text-muted">from referral bonuses</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Conversion Rate</div>
          <div className="text-3xl font-black text-status-success">{((converted / MY_REFERRALS.length) * 100).toFixed(0)}%</div>
          <div className="text-xs text-text-muted">vs 80.6% ecosystem avg</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Leaderboard</div>
          <div className="text-3xl font-black text-text-primary">#12</div>
          <div className="text-xs text-text-muted">of 18,420 referrers</div>
        </div>
      </div>

      {/* Referral list */}
      <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <h2 className="section-title mb-4">Your Referrals</h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Platform</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody>
              {MY_REFERRALS.map((r, i) => {
                const sCfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                return (
                  <tr key={i} className="border-b border-border-subtle hover:bg-base-elevated/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-base-overlay border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
                          {r.name[0]}
                        </div>
                        <span className="text-sm text-text-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                        style={{ color: PLATFORM_COLORS[r.platform], background: `${PLATFORM_COLORS[r.platform]}15` }}>
                        {r.platform.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: sCfg.color, background: sCfg.bg }}>
                        {sCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-muted">{r.joinedAt}</td>
                    <td className="px-5 py-3 text-right">
                      {r.pts > 0
                        ? <span className="text-sm font-bold text-nectar-400">+{r.pts.toLocaleString()}</span>
                        : <span className="text-xs text-text-muted">Pending</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

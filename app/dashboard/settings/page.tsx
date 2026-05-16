'use client';

import { Settings, Bell, Globe, Shield, Smartphone, ChevronRight } from 'lucide-react';
import { DEMO_USER, DEMO_REPUTATION, TIER_CONFIG } from '@/lib/nectar-portal/demo';
import { cn } from '@/lib/nectar-portal/cn';

const NOTIFICATION_SETTINGS = [
  { key: 'xp_gained',           label: 'XP Earned',              desc: 'When you earn XP from any event',   enabled: false },
  { key: 'achievement_unlocked',label: 'Achievement Unlocked',    desc: 'Immediate achievement unlock alerts',enabled: true },
  { key: 'tier_upgrade',        label: 'Tier Upgrade',            desc: 'When you advance to a new tier',    enabled: true },
  { key: 'campaign_activated',  label: 'Campaign Activation',     desc: 'When new campaigns go live',        enabled: true },
  { key: 'drop_live',           label: 'Drop Available',          desc: 'When you are eligible for a drop',  enabled: true },
  { key: 'streak_warning',      label: 'Streak Warning',          desc: 'When your streak is about to break', enabled: true },
  { key: 'leaderboard_movement',label: 'Leaderboard Changes',     desc: 'Rank changes on leaderboards',      enabled: false },
  { key: 'referral_bonus',      label: 'Referral Bonus',          desc: 'When a referral makes a purchase',  enabled: true },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative h-5 w-9 rounded-full border transition-all duration-200',
        enabled ? 'bg-nectar-400 border-nectar-400' : 'bg-base-overlay border-border'
      )}
    >
      <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200', enabled ? 'left-4' : 'left-0.5')} />
    </button>
  );
}

export default function SettingsPage() {
  const tierCfg = TIER_CONFIG['bloom'];

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3 animate-fade-up">
        <Settings className="h-8 w-8 text-nectar-400" />
        <h1 className="text-3xl font-black text-text-primary">Settings</h1>
      </div>

      <div className="grid grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
        {/* Profile */}
        <div className="card p-6 space-y-5">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black border"
              style={{ background: tierCfg.bg, borderColor: `${tierCfg.color}30`, color: tierCfg.color }}>
              {DEMO_USER.avatarInitials}
            </div>
            <div>
              <div className="text-lg font-bold text-text-primary">{DEMO_USER.displayName}</div>
              <div className="text-sm text-text-muted">@{DEMO_USER.username}</div>
              <div className="text-xs mt-1 font-bold uppercase tracking-wider" style={{ color: tierCfg.color }}>
                {tierCfg.name} Tier · {tierCfg.multiplier}× Multiplier
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Display Name</label>
              <input className="portal-input mt-1 text-sm" defaultValue={DEMO_USER.displayName} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</label>
              <input className="portal-input mt-1 text-sm" defaultValue={DEMO_USER.email} type="email" />
            </div>
          </div>
          <button className="btn-nectar text-xs py-2">Save Changes</button>
        </div>

        {/* Reputation */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-status-success" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Reputation</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg width={80} height={80} className="-rotate-90">
                <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={40} cy={40} r={32} fill="none" stroke="#34D399" strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - DEMO_REPUTATION.overallScore / 100)} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-text-primary">{DEMO_REPUTATION.overallScore}</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-status-success capitalize">{DEMO_REPUTATION.trustLevel}</div>
              <div className="text-xs text-text-muted">Trust Level</div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Engagement',  value: DEMO_REPUTATION.engagementScore, color: '#60A5FA' },
              { label: 'Purchases',   value: DEMO_REPUTATION.purchaseScore,    color: '#F97316' },
              { label: 'Referrals',   value: DEMO_REPUTATION.referralScore,    color: '#34D399' },
              { label: 'Community',   value: DEMO_REPUTATION.communityScore,   color: '#A78BFA' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-text-muted">{s.label}</span>
                  <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-base-overlay">
                  <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-4 w-4 text-nectar-400" />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Notification Preferences</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {NOTIFICATION_SETTINGS.map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">{n.label}</div>
                <div className="text-xs text-text-muted">{n.desc}</div>
              </div>
              <Toggle enabled={n.enabled} onToggle={() => {}} />
            </div>
          ))}
        </div>
      </div>

      {/* Connected platforms */}
      <div className="card p-6 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <Globe className="h-4 w-4 text-nectar-400" />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Connected Platforms</h2>
        </div>
        <div className="space-y-3">
          {[
            { name: 'StreetPlayR', emoji: '👟', color: '#EF4444', connected: true, primary: true },
            { name: 'PlayR',       emoji: '🎯', color: '#8B5CF6', connected: true, primary: false },
            { name: 'PlayR Club',  emoji: '💎', color: '#06B6D4', connected: true, primary: false },
            { name: 'PlayR Game',  emoji: '🎮', color: '#F97316', connected: false, primary: false },
          ].map(p => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
              <span className="text-xl">{p.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  {p.name}
                  {p.primary && <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5 bg-nectar-400/10 text-nectar-400">PRIMARY</span>}
                </div>
              </div>
              <span className={cn('text-xs font-semibold', p.connected ? 'text-status-success' : 'text-text-muted')}>
                {p.connected ? 'Connected' : 'Not connected'}
              </span>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

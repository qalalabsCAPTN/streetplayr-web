'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Wallet, Trophy, Medal, Scroll,
  GitBranch, Activity, BarChart3, Star, Settings,
  ChevronRight, Bell, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';
import { TIER_CONFIG } from '@/lib/nectar-portal/demo';

const NAV = [
  { label: 'Overview',       href: '/dashboard/overview',      icon: LayoutDashboard },
  { label: 'Wallet',         href: '/dashboard/wallet',         icon: Wallet },
  { label: 'Progression',    href: '/dashboard/progression',    icon: Trophy },
  { label: 'Achievements',   href: '/dashboard/achievements',   icon: Medal },
  { label: 'Quests',         href: '/dashboard/quests',         icon: Scroll },
  { label: 'Leaderboards',   href: '/dashboard/leaderboards',   icon: BarChart3 },
  { label: 'Referrals',      href: '/dashboard/referrals',      icon: GitBranch },
  { label: 'Drops',          href: '/dashboard/drops',          icon: Star },
  { label: 'Activity',       href: '/dashboard/activity',       icon: Activity },
  { label: 'Settings',       href: '/dashboard/settings',       icon: Settings },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [email, setEmail] = useState('Member');
  const [tier, setTier] = useState('STREET');
  const [xp, setXp] = useState(0);
  const [pct, setPct] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      const { getLoyaltySnapshotAction } = await import('@/app/actions/loyalty');
      const result = await getLoyaltySnapshotAction();
      if (result.success) {
        setEmail(result.data.email || 'Member');
        setTier(result.data.tier);
        setXp(result.data.xp);
        setPct(result.data.progressPct);
        setBalance(result.data.sprrBalance);
      }
    })();
  }, []);

  const tierKey = tier === 'LEGEND' ? 'nectar' : tier === 'PLAYER' ? 'sprout' : 'seed';
  const tierCfg = TIER_CONFIG[tierKey];
  const xpPct = pct;
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl shadow-glow-nectar"
          style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E14 100%)' }}>
          <span className="text-sm font-black text-black">N</span>
        </div>
        <div>
          <div className="text-sm font-black text-text-primary tracking-tight">NECTAR</div>
          <div className="text-[9px] text-text-muted uppercase tracking-widest">Ecosystem</div>
        </div>
        <button type="button" className="ml-auto relative" aria-label="Notifications">
          <Bell className="h-4 w-4 text-text-muted hover:text-text-primary transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-nectar-400" />
        </button>
      </div>

      <div className="border-b border-border p-3">
        <div className="rounded-xl p-3" style={{ background: tierCfg.bg, border: `1px solid ${tierCfg.color}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-overlay text-xs font-bold text-text-primary">
              {initials}
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">{email}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tierCfg.color }}>
                {tierCfg.name}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-text-muted">{xp.toLocaleString()} XP</span>
              <span style={{ color: tierCfg.color }}>{xpPct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${tierCfg.color}90, ${tierCfg.color})`, boxShadow: `0 0 6px ${tierCfg.color}80` }}
              />
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href));
          const Icon: any = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn('portal-nav-item', active && 'active')}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-60')}
                style={active ? { color: 'currentColor' } : {}} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-40" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-xl bg-base-overlay border border-border px-3 py-2.5">
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">StreetPlayR wallet</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-nectar-400 tabular-nums">
              {balance.toLocaleString()}
            </span>
            <span className="text-[10px] text-text-muted">SPRR</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-base-surface/95 px-4 backdrop-blur-md">
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-text-primary"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="text-sm font-black text-text-primary tracking-tight">NECTAR</div>
      </div>

      {/* Mobile scrim */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer / desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col bg-base-surface border-r border-border transition-transform duration-300 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <SidebarBody onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}

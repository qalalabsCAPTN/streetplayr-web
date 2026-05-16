'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Package, Image,
  Zap, BarChart3, Radio, Settings, Wallet, Gift, Trophy,
  GitBranch, Star, Layers, ChevronRight, Activity,
  ClipboardList, Swords, Target, ShieldAlert, Eye,
} from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { PlatformSwitcher } from '@/components/ops2/platform-switcher';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'Core',
    items: [
      { label: 'Overview',    href: '/admin/overview',   icon: LayoutDashboard, exact: true },
      { label: 'Live Ops',    href: '/admin/liveops',    icon: Radio },
      { label: 'Analytics',   href: '/admin/analytics',  icon: BarChart3 },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Orders',      href: '/admin/orders',     icon: ClipboardList },
      { label: 'Customers',   href: '/admin/customers',  icon: Users },
      { label: 'Inventory',   href: '/admin/inventory',  icon: Package },
      { label: 'Media',       href: '/admin/commerce',   icon: Image },
    ],
  },
  {
    title: 'NECTAR',
    items: [
      { label: 'Events',      href: '/admin/nectar/events',       icon: Activity },
      { label: 'Wallets',     href: '/admin/nectar/wallets',      icon: Wallet },
      { label: 'Rewards',     href: '/admin/nectar/rewards',      icon: Gift },
      { label: 'Campaigns',   href: '/admin/nectar/campaigns',    icon: Zap },
      { label: 'Progression', href: '/admin/nectar/progression',  icon: Trophy },
      { label: 'Referrals',   href: '/admin/nectar/referrals',    icon: GitBranch },
      { label: 'Drops',       href: '/admin/nectar/drops',        icon: Star },
      { label: 'Tiers',       href: '/admin/nectar/tiers',        icon: Layers },
      { label: 'Achievements',href: '/admin/nectar/achievements', icon: Swords },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Observability', href: '/admin/observability', icon: Eye },
      { label: 'Segments',      href: '/admin/segments',      icon: Target },
      { label: 'Risk Engine',   href: '/admin/risk',          icon: ShieldAlert },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings',    href: '/admin/settings',    icon: Settings },
      { label: 'Access',      href: '/admin/settings/access', icon: Users },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-base-surface">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-nectar-400 shadow-glow-nectar">
          <span className="text-xs font-bold text-base-DEFAULT">N</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary leading-tight tracking-tight">NECTAR</span>
          <span className="text-[10px] text-text-muted leading-tight uppercase tracking-widest">OpsOS</span>
        </div>
      </div>

      <div className="border-b border-border px-3 py-2">
        <PlatformSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV.map((section) => (
          <div key={section.title}>
            <div className="nav-item-section">{section.title}</div>
            {section.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('nav-item group', active && 'active')}
                >
                  <Icon className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? 'text-nectar-400' : 'text-text-muted group-hover:text-text-secondary'
                  )} />
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-nectar-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-nectar-400">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <ChevronRight className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-base-elevated transition-colors cursor-pointer">
          <div className="h-7 w-7 rounded-full bg-base-overlay border border-border flex items-center justify-center text-xs font-medium text-text-secondary">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-text-primary truncate">Admin</div>
            <div className="text-[10px] text-text-muted truncate">super_admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

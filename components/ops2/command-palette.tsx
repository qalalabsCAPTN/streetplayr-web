'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search, LayoutDashboard, Users, Wallet, Gift, Activity,
  BarChart3, Radio, Settings, Zap, GitBranch, Trophy, Star,
  Eye, Target, ShieldAlert, Swords,
} from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { useCommandStore } from '@/stores/ops2/command-store';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string[];
}

const NAV_COMMANDS: CommandItem[] = [
  { id: 'overview',    label: 'Overview',           icon: LayoutDashboard, href: '/admin/overview',              group: 'Navigate' },
  { id: 'liveops',     label: 'Live Ops',            icon: Radio,           href: '/admin/liveops',               group: 'Navigate' },
  { id: 'analytics',   label: 'Analytics',           icon: BarChart3,       href: '/admin/analytics',             group: 'Navigate' },
  { id: 'customers',   label: 'Customers',           icon: Users,           href: '/admin/customers',             group: 'Navigate' },
  { id: 'events',      label: 'Event Stream',        icon: Activity,        href: '/admin/nectar/events',         group: 'NECTAR' },
  { id: 'wallets',     label: 'Wallet Management',   icon: Wallet,          href: '/admin/nectar/wallets',        group: 'NECTAR' },
  { id: 'rewards',     label: 'Reward Rules',        icon: Gift,            href: '/admin/nectar/rewards',        group: 'NECTAR' },
  { id: 'campaigns',   label: 'Campaigns',           icon: Zap,             href: '/admin/nectar/campaigns',      group: 'NECTAR' },
  { id: 'progression', label: 'Progression',         icon: Trophy,          href: '/admin/nectar/progression',    group: 'NECTAR' },
  { id: 'referrals',   label: 'Referrals',           icon: GitBranch,       href: '/admin/nectar/referrals',      group: 'NECTAR' },
  { id: 'drops',          label: 'Drops',               icon: Star,        href: '/admin/nectar/drops',          group: 'NECTAR' },
  { id: 'achievements',   label: 'Achievements',        icon: Swords,      href: '/admin/nectar/achievements',   group: 'NECTAR' },
  { id: 'observability',  label: 'Observability',       icon: Eye,         href: '/admin/observability',          group: 'Intelligence' },
  { id: 'segments',       label: 'Segments',            icon: Target,      href: '/admin/segments',               group: 'Intelligence' },
  { id: 'risk',           label: 'Risk Engine',         icon: ShieldAlert, href: '/admin/risk',                   group: 'Intelligence' },
  { id: 'settings',       label: 'Settings',            icon: Settings,    href: '/admin/settings',               group: 'System' },
  { id: 'access',         label: 'Access Control',      icon: Users,       href: '/admin/settings/access',        group: 'System' },
];

export function CommandPalette() {
  const { open, query, closePalette, togglePalette, setQuery } = useCommandStore();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        togglePalette();
      }
      if (e.key === 'Escape') closePalette();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [togglePalette, closePalette]);

  const handleSelect = useCallback((item: CommandItem) => {
    closePalette();
    if (item.href) router.push(item.href);
    else item.action?.();
  }, [router, closePalette]);

  if (!open) return null;

  const groups = Array.from(new Set(NAV_COMMANDS.map(c => c.group)));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] animate-fade-in">
      <div
        className="absolute inset-0 bg-base-DEFAULT/60 backdrop-blur-sm"
        onClick={closePalette}
      />

      <div className={cn(
        'relative w-full max-w-xl mx-4',
        'bg-base-elevated border border-border rounded-2xl',
        'shadow-overlay overflow-hidden',
        'animate-slide-in-up'
      )}>
        <Command shouldFilter label="Command palette">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-text-muted shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Navigate, search customers, run actions..."
              className={cn(
                'flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted',
                'focus:outline-none'
              )}
              autoFocus
            />
            <kbd className="shrink-0 text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5">ESC</kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-text-muted">
              No results for &ldquo;{query}&rdquo;
            </Command.Empty>

            {groups.map(group => (
              <Command.Group key={group} heading={group}>
                <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  {group}
                </div>
                {NAV_COMMANDS.filter(c => c.group === group).map(item => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.description ?? ''} ${item.keywords?.join(' ') ?? ''}`}
                      onSelect={() => handleSelect(item)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer select-none',
                        'text-text-secondary hover:text-text-primary hover:bg-base-overlay',
                        'data-[selected=true]:bg-base-overlay data-[selected=true]:text-text-primary',
                        'transition-colors duration-100'
                      )}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-surface border border-border">
                        <Icon className="h-3.5 w-3.5 text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-text-muted truncate">{item.description}</div>
                        )}
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-[10px] text-text-muted">
            <div className="flex items-center gap-1"><kbd className="border border-border rounded px-1 py-0.5 font-mono">↑↓</kbd> navigate</div>
            <div className="flex items-center gap-1"><kbd className="border border-border rounded px-1 py-0.5 font-mono">↵</kbd> select</div>
            <div className="flex items-center gap-1"><kbd className="border border-border rounded px-1 py-0.5 font-mono">ESC</kbd> close</div>
          </div>
        </Command>
      </div>
    </div>
  );
}

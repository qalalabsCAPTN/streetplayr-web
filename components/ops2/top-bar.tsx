'use client';

import { Search, Bell, Wifi } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { useCommandStore } from '@/stores/ops2/command-store';
import { usePlatformStore } from '@/stores/ops2/platform-store';
import { StatusDot } from '@/components/ops2/ui/status-dot';

interface TopBarProps {
  title?: string;
  children?: React.ReactNode;
}

export function TopBar({ title, children }: TopBarProps) {
  const { openPalette } = useCommandStore();
  const { activePlatform } = usePlatformStore();

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 flex h-14 items-center gap-4 border-b border-border',
      'bg-base-surface/90 backdrop-blur-md px-5',
      'left-[240px]'
    )}>
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {title && (
          <h1 className="text-sm font-semibold text-text-primary truncate">{title}</h1>
        )}
        {children}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={openPalette}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border',
            'bg-base-elevated text-text-muted text-xs',
            'hover:border-border-strong hover:text-text-secondary transition-all duration-150',
            'cursor-pointer select-none'
          )}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Search...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border bg-base-overlay px-1 py-0.5 text-[10px] font-mono text-text-muted">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-base-elevated border border-border">
          <StatusDot status="live" />
          <span className="hidden lg:block text-xs text-text-muted">Live</span>
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-base-elevated hover:border-border-strong transition-colors duration-150">
          <Bell className="h-4 w-4 text-text-muted" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-nectar-400" />
        </button>

        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium',
          activePlatform.badgeClass
        )}>
          <div className={cn('h-1.5 w-1.5 rounded-full', `bg-[${activePlatform.color}]`)}
               style={{ backgroundColor: activePlatform.color }}
          />
          <span>{activePlatform.label}</span>
        </div>
      </div>
    </header>
  );
}

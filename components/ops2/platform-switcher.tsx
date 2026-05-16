'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/ops2/cn';
import { usePlatformStore } from '@/stores/ops2/platform-store';
import { PLATFORMS, type PlatformId } from '@/types/ops2/ops';

const PLATFORM_DOTS: Record<PlatformId, string> = {
  all:         'bg-platform-all',
  streetplayr: 'bg-platform-streetplayr',
  playr:       'bg-platform-playr',
  'playr-club':'bg-platform-club',
  'playr-game':'bg-platform-game',
};

export function PlatformSwitcher() {
  const [open, setOpen] = useState(false);
  const { activePlatform, activePlatformId, setPlatform } = usePlatformStore();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm',
          'bg-base-elevated border border-border',
          'hover:border-border-strong hover:bg-base-overlay',
          'transition-all duration-150 cursor-pointer select-none'
        )}
      >
        <div className={cn('h-2 w-2 rounded-full shrink-0', PLATFORM_DOTS[activePlatformId])} />
        <span className="flex-1 text-left font-medium text-text-primary truncate">
          {activePlatform.label}
        </span>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-text-muted shrink-0 transition-transform duration-150',
          open && 'rotate-180'
        )} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className={cn(
            'absolute left-0 right-0 top-full mt-1 z-20',
            'bg-base-elevated border border-border rounded-xl',
            'shadow-overlay overflow-hidden',
            'animate-slide-in-up'
          )}>
            <div className="p-1">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => { setPlatform(platform.id); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm',
                    'hover:bg-base-overlay transition-colors duration-100 cursor-pointer text-left',
                    activePlatformId === platform.id && 'bg-base-overlay'
                  )}
                >
                  <div className={cn('h-2 w-2 rounded-full shrink-0', PLATFORM_DOTS[platform.id])} />
                  <span className={cn(
                    'flex-1 font-medium',
                    activePlatformId === platform.id ? 'text-text-primary' : 'text-text-secondary'
                  )}>
                    {platform.label}
                  </span>
                  {activePlatformId === platform.id && (
                    <Check className="h-3.5 w-3.5 text-nectar-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

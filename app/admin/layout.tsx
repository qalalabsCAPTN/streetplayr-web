import { Sidebar } from '@/components/ops2/sidebar';
import { CommandPalette } from '@/components/ops2/command-palette';
import { PlatformHydrator } from '@/components/ops2/platform-hydrator';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      {/* Loads sites from DB and hydrates platform-store on mount */}
      <PlatformHydrator />
      <Sidebar />
      <main className="pl-60 flex flex-col min-h-screen">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

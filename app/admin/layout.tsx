import { Sidebar } from '@/components/ops2/sidebar';
import { CommandPalette } from '@/components/ops2/command-palette';
import { PlatformHydrator } from '@/components/ops2/platform-hydrator';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      {/* Loads sites from DB and hydrates platform-store on mount */}
      <PlatformHydrator />
      <Sidebar />
      <main className="ml-[240px] min-h-screen">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}

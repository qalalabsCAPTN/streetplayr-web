import { Sidebar } from '@/components/ops2/sidebar';
import { CommandPalette } from '@/components/ops2/command-palette';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
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

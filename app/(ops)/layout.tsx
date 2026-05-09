import { OpsProvider } from "@/components/ops/OpsProvider";
import OpsHeader from "@/components/ops/OpsHeader";
import CommandPalette from "@/components/ops/CommandPalette";
import OpsGuard from "@/components/auth/OpsGuard";

export const dynamic = 'force-dynamic';

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OpsProvider>
      <OpsGuard>
        <div className="min-h-screen bg-[var(--ops-bg-base)] text-[var(--ops-text-primary)] selection:bg-[var(--ops-accent)] selection:text-black">
          {/* Subtle tonal background gradient */}
          <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[var(--ops-bg-surface)]/20 to-transparent z-0" />
          
          <OpsHeader />
          
          <main className="relative z-10 p-6 lg:p-12">
            {children}
          </main>

          <CommandPalette />
        </div>
      </OpsGuard>
    </OpsProvider>
  );
}

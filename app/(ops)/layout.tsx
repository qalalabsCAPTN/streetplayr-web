import { redirect } from "next/navigation";
import { OpsProvider } from "@/components/ops/OpsProvider";
import OpsHeader from "@/components/ops/OpsHeader";
import CommandPalette from "@/components/ops/CommandPalette";
import OpsGuard from "@/components/auth/OpsGuard";
import { getSSRUser } from "@/lib/auth/ssr";
import { isOpsRole } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSSRUser();
  if (!user) {
    redirect("/login?redirect=/ops");
  }
  if (!isOpsRole(user.role)) {
    redirect("/home");
  }

  return (
    <OpsProvider>
      <OpsGuard>
        <div className="min-h-screen bg-[var(--ops-bg-base)] text-[var(--ops-text-primary)] selection:bg-[var(--ops-accent)] selection:text-black">
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

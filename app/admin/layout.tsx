import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/ops2/sidebar';
import { CommandPalette } from '@/components/ops2/command-palette';
import { PlatformHydrator } from '@/components/ops2/platform-hydrator';
import { getSSRUser } from '@/lib/auth/ssr';
import { isOpsRole } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSSRUser();
  if (!user) {
    redirect('/login?redirect=/admin');
  }
  if (!isOpsRole(user.role)) {
    redirect('/home');
  }

  let initialSites: { id: string; slug: string; name: string; color: string | null }[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('sites')
      .select('id, slug, name, color')
      .eq('is_active', true)
      .order('name', { ascending: true });
    initialSites = (data ?? []) as typeof initialSites;
  } catch {
    // Hydrator falls back to server action load
  }

  return (
    <div className="min-h-screen bg-base">
      <PlatformHydrator initialSites={initialSites} />
      <Sidebar />
      <main className="pl-60 flex flex-col min-h-screen">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/nectar/dashboard-sidebar';
import { getSSRUser } from '@/lib/auth/ssr';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSSRUser();
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  return (
    <div className="flex min-h-screen nectar-portal-root">
      <DashboardSidebar />
      <main className="flex-1 min-h-screen w-full ml-0 md:ml-[220px] transition-[margin] duration-300 ease-out">
        {children}
      </main>
    </div>
  );
}

'use client';

import { DashboardSidebar as Sidebar, DashboardTabBar as TabBar } from '@/components/dashboard/DBNav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-root">
      <Sidebar />
      <main className="dash-content">{children}</main>
      <TabBar />
    </div>
  );
}

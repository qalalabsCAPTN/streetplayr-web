'use client';

import { DashboardSidebar, DashboardTabBar } from '@/components/dashboard/DBNav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-root">
      <DashboardSidebar />
      <main className="dashboard-content">{children}</main>
      <DashboardTabBar />
    </div>
  );
}

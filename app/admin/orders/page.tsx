import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
export const metadata: Metadata = { title: 'Orders' };
export default function OrdersPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Orders" />
      <div className="flex-1 pt-14 p-5">
        <h2 className="page-title">Orders</h2>
        <p className="text-sm text-text-muted mt-0.5">Cross-platform order history</p>
      </div>
    </div>
  );
}

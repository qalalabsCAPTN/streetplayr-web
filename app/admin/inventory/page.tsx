import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
export const metadata: Metadata = { title: 'Inventory' };
export default function InventoryPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Inventory" />
      <div className="flex-1 pt-14 p-5">
        <h2 className="page-title">Inventory</h2>
        <p className="text-sm text-text-muted mt-0.5">Product and drop inventory management</p>
      </div>
    </div>
  );
}

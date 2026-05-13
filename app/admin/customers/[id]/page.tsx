import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { CustomerProfile } from '@/modules/customers/components/customer-profile';

export const metadata: Metadata = { title: 'Customer Profile' };

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Customer Profile" />
      <div className="flex-1 pt-14 p-5 min-h-0">
        <CustomerProfile userId={params.id} />
      </div>
    </div>
  );
}

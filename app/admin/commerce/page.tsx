import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
export const metadata: Metadata = { title: 'Commerce' };
export default function CommercePage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Commerce" />
      <div className="flex-1 pt-14 p-5">
        <h2 className="page-title">Commerce</h2>
        <p className="text-sm text-text-muted mt-0.5">Media, content, and storefront management</p>
      </div>
    </div>
  );
}

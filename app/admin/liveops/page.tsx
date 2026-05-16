import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { LiveOpsCenter } from '@/modules/liveops/components/liveops-center';

export const metadata: Metadata = { title: 'Live Ops' };

export default function LiveOpsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Live Ops" />
      <div className="flex-1 pt-14 p-5 flex flex-col gap-5 min-h-0">
        <div>
          <h2 className="page-title">Live Operations</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Realtime ecosystem pulse — events/minute, active users, reward velocity
          </p>
        </div>
        <LiveOpsCenter />
      </div>
    </div>
  );
}

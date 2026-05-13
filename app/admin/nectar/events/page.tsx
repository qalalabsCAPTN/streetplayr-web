import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { EventStreamMonitor } from '@/modules/nectar/events/components/event-stream-monitor';

export const metadata: Metadata = { title: 'Event Stream' };

export default function EventsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Event Stream" />
      <div className="flex-1 pt-14 p-5 flex flex-col min-h-0">
        <div className="mb-5">
          <h2 className="page-title">Event Monitoring</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Realtime event ingestion, processing queue, and dead-letter management
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <EventStreamMonitor />
        </div>
      </div>
    </div>
  );
}

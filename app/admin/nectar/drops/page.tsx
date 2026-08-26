import { TopBar } from '@/components/ops2/top-bar';
import { UnavailableModule } from '@/components/ops2/UnavailableModule';

export default function AdminDropsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Drops" />
      <div className="flex-1 pt-14">
        <UnavailableModule
          title="Drops"
          reason="Exclusive drop inventory is not wired to a live table. Demo drop calendars were removed."
        />
      </div>
    </div>
  );
}

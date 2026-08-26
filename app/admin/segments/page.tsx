import { TopBar } from '@/components/ops2/top-bar';
import { UnavailableModule } from '@/components/ops2/UnavailableModule';

export default function SegmentsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Segments" />
      <div className="flex-1 pt-14">
        <UnavailableModule
          title="Segments"
          reason="Audience segments have no live table. Demo segments were removed."
        />
      </div>
    </div>
  );
}

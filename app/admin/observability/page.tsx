import { TopBar } from '@/components/ops2/top-bar';
import { UnavailableModule } from '@/components/ops2/UnavailableModule';

export default function ObservabilityPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Observability" />
      <div className="flex-1 pt-14">
        <UnavailableModule
          title="Observability"
          reason="Queue traces and worker charts were demo fixtures. Use operational_events in the database and Vercel logs until a live worker pipeline exists."
        />
      </div>
    </div>
  );
}

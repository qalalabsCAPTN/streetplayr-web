import { TopBar } from '@/components/ops2/top-bar';
import { UnavailableModule } from '@/components/ops2/UnavailableModule';

export default function RiskPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Risk" />
      <div className="flex-1 pt-14">
        <UnavailableModule
          title="Risk"
          reason="No live risk_flags table is wired. Demo flags were removed so this screen cannot be mistaken for production monitoring."
        />
      </div>
    </div>
  );
}

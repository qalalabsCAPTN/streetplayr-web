import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
export const metadata: Metadata = { title: 'Settings' };
export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Settings" />
      <div className="flex-1 pt-14 p-5">
        <h2 className="page-title">Settings</h2>
        <p className="text-sm text-text-muted mt-0.5">System configuration, platform tokens, and NECTAR settings</p>
      </div>
    </div>
  );
}

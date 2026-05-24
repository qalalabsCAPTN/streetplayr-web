'use client';

import { ProfileSidebar, ProfileTopTabs } from '@/components/profile/ProfileNav';
import { usePathname } from 'next/navigation';

export default function ProfileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Contextual right panel content based on current route
  const rightPanel = getRightPanel(pathname);

  return (
    <>
      {/* ── Environmental overlays ── */}
      <div className="pointer-events-none fixed inset-0 scanline-overlay z-[60]" />
      <div className="pointer-events-none fixed inset-0 grain-overlay z-[60]" />
      <div className="pointer-events-none fixed inset-0 hud-grid z-0" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.25)_0%,transparent_10%,transparent_90%,rgba(0,0,0,0.25)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(221,183,255,0.05)_0%,transparent_55%)]" />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Left vertical framing rail ── */}
      <div className="fixed left-0 top-0 bottom-0 w-px bg-white/[0.04] z-20 pointer-events-none" />
      <div className="fixed left-0 top-0 bottom-0 w-px bg-white/[0.02] translate-x-[7px] z-20 pointer-events-none" />

      {/* ── Main 3-column layout ── */}
      <div className="relative z-10 flex min-h-screen">
        {/* Column 1: Identity Navigation Rail */}
        <ProfileSidebar />

        {/* Column 2: Main command area */}
        <main className="flex-1 min-w-0 pt-24 pb-28 px-6 sm:px-10 lg:px-14" id="profile-content">
          <ProfileTopTabs />
          {children}
        </main>

        {/* Column 3: Contextual intelligence panel */}
        {rightPanel && (
          <aside className="hidden xl:block w-[280px] min-h-screen border-l border-white/[0.06] bg-[#16111b]/60 backdrop-blur-xl sticky top-0 h-screen pt-24 overflow-y-auto">
            {rightPanel}
          </aside>
        )}
      </div>

      
    </>
  );
}

// ─── Contextual right panel per route ───────────────────────────────────
function getRightPanel(pathname: string): React.ReactNode {
  switch (pathname) {
    case '/profile':
      return <IdentityContextPanel />;
    case '/profile/wallet':
      return <WalletContextPanel />;
    case '/profile/rewards':
      return <RewardsContextPanel />;
    case '/profile/orders':
      return <OrdersContextPanel />;
    case '/profile/addresses':
      return <AddressesContextPanel />;
    case '/profile/settings':
      return <SettingsContextPanel />;
    default:
      return null;
  }
}

// ── Identity Context Panel ──────────────────────────────────────────────
function IdentityContextPanel() {
  return (
    <div className="px-5">
      <div className="pb-5 mb-4 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ INTEL ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Session Overview</span>
      </div>

      <div className="space-y-4">
        <SummaryRow label="Status" value="Active" valueColor="text-green-400" />
        <SummaryRow label="Auth Method" value="Google OAuth" />
        <SummaryRow label="Encryption" value="TLS 1.3" />
        <SummaryRow label="Session ID" value="STR-24-7A" mono />
        <SummaryRow label="Node" value="MUM-01" mono />
      </div>

      {/* HUD coordinates */}
      <div className="mt-8 pt-5 border-t border-white/[0.04]">
        <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/12 leading-relaxed">
          <p>COORD: 19.0760°N / 72.8777°E</p>
          <p>UPTIME: 99.9%</p>
          <p>NODE: READY</p>
        </div>
      </div>
    </div>
  );
}

// ── Wallet Context Panel ────────────────────────────────────────────────
function WalletContextPanel() {
  return (
    <div className="px-5">
      <div className="pb-5 mb-4 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ WALLET ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Financial Summary</span>
      </div>

      <div className="space-y-4">
        <SummaryRow label="Available Balance" value="$SP_942" mono />
        <SummaryRow label="Reward Points" value="12,450" />
        <SummaryRow label="Pending" value="0" />
        <SummaryRow label="Tier Multiplier" value="1.5x" />
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.05]">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20 block mb-3">Earning Methods</span>
        <div className="space-y-2">
          <QuickAction href="#" label="Referral Program" />
          <QuickAction href="#" label="Review Rewards" />
          <QuickAction href="#" label="Drop Bonuses" />
        </div>
      </div>
    </div>
  );
}

// ── Rewards Context Panel ───────────────────────────────────────────────
function RewardsContextPanel() {
  return (
    <div className="px-5">
      <div className="pb-5 mb-4 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ REWARDS ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Progression Intel</span>
      </div>

      <div className="space-y-4">
        <SummaryRow label="Active Campaigns" value="3" />
        <SummaryRow label="Streak" value="12 days" />
        <SummaryRow label="Missions" value="4 pending" />
      </div>
    </div>
  );
}

// ── Orders Context Panel ────────────────────────────────────────────────
function OrdersContextPanel() {
  return (
    <div className="px-5">
      <div className="pb-5 mb-4 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ ARCHIVE ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Acquisition Stats</span>
      </div>

      <div className="space-y-4">
        <SummaryRow label="Total Orders" value="—" />
        <SummaryRow label="Delivered" value="—" />
        <SummaryRow label="In Transit" value="—" />
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.05]">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20 block mb-3">Shipping Info</span>
        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/15 leading-relaxed">
          Free shipping on orders over $500.<br />
          14-day return window.
        </p>
      </div>
    </div>
  );
}

// ── Addresses Context Panel ─────────────────────────────────────────────
function AddressesContextPanel() {
  return (
    <div className="px-5">
      <div className="pb-5 mb-4 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ ADDRESSES ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Delivery Diagnostics</span>
      </div>

      <div className="space-y-4">
        <SummaryRow label="Saved Addresses" value="—" />
        <SummaryRow label="Primary" value="Not set" />
      </div>
    </div>
  );
}

// ── Settings Context Panel ──────────────────────────────────────────────
function SettingsContextPanel() {
  return (
    <div className="px-5">
      <div className="pb-5 mb-4 border-b border-white/[0.05]">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#ddb7ff]/[0.5] block mb-2">[ SYSTEM ]</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">Preferences Status</span>
      </div>

      <div className="space-y-4">
        <SummaryRow label="Auth Method" value="Google OAuth" />
        <SummaryRow label="Notifications" value="Enabled" valueColor="text-green-400" />
        <SummaryRow label="Drop Alerts" value="On" />
        <SummaryRow label="Order Updates" value="On" />
      </div>
    </div>
  );
}

// ── Shared Components ───────────────────────────────────────────────────

function SummaryRow({ label, value, valueColor = "text-white/60", mono = false }: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/25">{label}</span>
      <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${mono ? 'text-[#ddb7ff]/60' : valueColor}`}>
        {value}
      </span>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block px-3 py-2 border border-white/[0.06] hover:border-[#ddb7ff]/30 transition-colors font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-[#ddb7ff]/70"
    >
      {label} →
    </a>
  );
}

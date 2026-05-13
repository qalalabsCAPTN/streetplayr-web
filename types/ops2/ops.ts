export type PlatformId = 'all' | 'streetplayr' | 'playr' | 'playr-club' | 'playr-game';

export interface Platform {
  id: PlatformId;
  label: string;
  color: string;
  accentClass: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  active: boolean;
}

export const PLATFORMS: Platform[] = [
  { id: 'all',        label: 'All Platforms', color: '#6366F1', accentClass: 'text-platform-all',        bgClass: 'bg-platform-all/10',        textClass: 'text-platform-all',        badgeClass: 'bg-platform-all/15 text-platform-all border-platform-all/30',        active: true },
  { id: 'streetplayr',label: 'StreetPlayR',   color: '#F5A800', accentClass: 'text-platform-streetplayr', bgClass: 'bg-platform-streetplayr/10', textClass: 'text-platform-streetplayr', badgeClass: 'bg-platform-streetplayr/15 text-platform-streetplayr border-platform-streetplayr/30', active: true },
  { id: 'playr',      label: 'PlayR',         color: '#7C3AED', accentClass: 'text-platform-playr',       bgClass: 'bg-platform-playr/10',       textClass: 'text-platform-playr',       badgeClass: 'bg-platform-playr/15 text-platform-playr border-platform-playr/30',       active: true },
  { id: 'playr-club', label: 'PlayR Club',    color: '#059669', accentClass: 'text-platform-club',        bgClass: 'bg-platform-club/10',        textClass: 'text-platform-club',        badgeClass: 'bg-platform-club/15 text-platform-club border-platform-club/30',        active: true },
  { id: 'playr-game', label: 'PlayR Game',    color: '#DC2626', accentClass: 'text-platform-game',        bgClass: 'bg-platform-game/10',        textClass: 'text-platform-game',        badgeClass: 'bg-platform-game/15 text-platform-game border-platform-game/30',        active: true },
];

export type OpsUserRole =
  | 'super_admin'
  | 'ops_admin'
  | 'support'
  | 'growth'
  | 'finance'
  | 'campaign_manager';

export interface OpsUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: OpsUserRole;
  platformAccess: PlatformId[];
  createdAt: string;
}

export type Permission =
  | 'customers:read'
  | 'customers:write'
  | 'customers:adjust_wallet'
  | 'customers:flag'
  | 'rewards:read'
  | 'rewards:write'
  | 'rewards:delete'
  | 'rewards:test_execute'
  | 'campaigns:read'
  | 'campaigns:write'
  | 'campaigns:activate'
  | 'events:read'
  | 'events:replay'
  | 'wallets:read'
  | 'wallets:manual_credit'
  | 'wallets:manual_debit'
  | 'analytics:read'
  | 'analytics:export'
  | 'settings:read'
  | 'settings:write'
  | 'access:manage';

export const ROLE_PERMISSIONS: Record<OpsUserRole, Permission[]> = {
  super_admin: [
    'customers:read', 'customers:write', 'customers:adjust_wallet', 'customers:flag',
    'rewards:read', 'rewards:write', 'rewards:delete', 'rewards:test_execute',
    'campaigns:read', 'campaigns:write', 'campaigns:activate',
    'events:read', 'events:replay',
    'wallets:read', 'wallets:manual_credit', 'wallets:manual_debit',
    'analytics:read', 'analytics:export',
    'settings:read', 'settings:write', 'access:manage',
  ],
  ops_admin: [
    'customers:read', 'customers:write', 'customers:adjust_wallet', 'customers:flag',
    'rewards:read', 'rewards:write', 'rewards:test_execute',
    'campaigns:read', 'campaigns:write', 'campaigns:activate',
    'events:read', 'events:replay',
    'wallets:read', 'wallets:manual_credit',
    'analytics:read', 'analytics:export',
    'settings:read',
  ],
  support: [
    'customers:read', 'customers:flag',
    'rewards:read',
    'campaigns:read',
    'events:read',
    'wallets:read', 'wallets:manual_credit',
    'analytics:read',
  ],
  growth: [
    'customers:read',
    'rewards:read', 'rewards:write', 'rewards:test_execute',
    'campaigns:read', 'campaigns:write', 'campaigns:activate',
    'events:read',
    'wallets:read',
    'analytics:read', 'analytics:export',
  ],
  finance: [
    'customers:read',
    'rewards:read',
    'campaigns:read',
    'wallets:read',
    'analytics:read', 'analytics:export',
  ],
  campaign_manager: [
    'customers:read',
    'rewards:read', 'rewards:write', 'rewards:test_execute',
    'campaigns:read', 'campaigns:write', 'campaigns:activate',
    'wallets:read',
    'analytics:read',
  ],
};

export interface EcosystemKPIs {
  platformId: PlatformId;
  period: '1d' | '7d' | '30d';
  gmv: number;
  gmvDelta: number;
  activeUsers: number;
  activeUsersDelta: number;
  pointsIssued: number;
  pointsIssuedDelta: number;
  xpIssued: number;
  rewardExecutions: number;
  rewardExecutionsDelta: number;
  referrals: number;
  referralsDelta: number;
  walletCirculation: number;
  rewardLiability: number;
  conversionRate: number;
  conversionRateDelta: number;
}

export interface RealtimeStatus {
  connected: boolean;
  eventsPerMinute: number;
  workerHealth: 'healthy' | 'degraded' | 'down';
  queueDepth: number;
  lastEventAt?: string;
}

export interface CustomerOverview {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'flagged' | 'closed';
  tier: string;
  lifetimeXp: number;
  pointsBalance: number;
  totalSpend: number;
  orderCount: number;
  referralCount: number;
  joinedAt: string;
  lastActiveAt?: string;
  riskScore: number;
  connectedPlatforms: string[];
}

export interface WalletSummary {
  walletType: string;
  available: number;
  held: number;
  totalEarned: number;
  totalSpent: number;
  transactionCount: number;
}

export interface ActivityTimelineItem {
  id: string;
  type: 'event' | 'reward' | 'transaction' | 'referral' | 'achievement' | 'tier_change';
  title: string;
  description: string;
  platform?: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

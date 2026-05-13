export type SegmentStatus = 'active' | 'draft' | 'archived';
export type SegmentType = 'static' | 'dynamic' | 'behavioral' | 'predictive';

export interface SegmentCondition {
  id: string;
  field: string;
  operator: string;
  value: unknown;
  valueTo?: unknown;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  status: SegmentStatus;
  type: SegmentType;
  conditions: SegmentCondition[];
  estimatedSize: number;
  lastComputedAt?: string;
  refreshIntervalMinutes?: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_SEGMENTS: Segment[] = [
  {
    id: 'seg_high_value',
    name: 'High-Value Customers',
    description: 'Users with 50k+ lifetime XP and 10+ orders. Core monetization segment.',
    status: 'active',
    type: 'behavioral',
    conditions: [
      { id: 'c1', field: 'lifetime_xp', operator: 'gte', value: 50000 },
      { id: 'c2', field: 'total_orders', operator: 'gte', value: 10 },
      { id: 'c3', field: 'last_active_days_ago', operator: 'lte', value: 30 },
    ],
    estimatedSize: 2847,
    lastComputedAt: '2026-05-13T06:00:00Z',
    refreshIntervalMinutes: 60,
    tags: ['monetization', 'retention'],
    createdBy: 'growth@nectar.internal',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-05-13T06:00:00Z',
  },
  {
    id: 'seg_at_risk',
    name: 'At-Risk Churners',
    description: 'Previously active users who have gone quiet in the last 7-30 days.',
    status: 'active',
    type: 'behavioral',
    conditions: [
      { id: 'c1', field: 'last_active_days_ago', operator: 'between', value: 7, valueTo: 30 },
      { id: 'c2', field: 'lifetime_xp', operator: 'gte', value: 5000 },
      { id: 'c3', field: 'total_orders', operator: 'gte', value: 3 },
    ],
    estimatedSize: 4312,
    lastComputedAt: '2026-05-13T06:00:00Z',
    refreshIntervalMinutes: 120,
    tags: ['retention', 'churn'],
    createdBy: 'growth@nectar.internal',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-05-13T06:00:00Z',
  },
  {
    id: 'seg_apex_tier',
    name: 'APEX Members',
    description: 'All users currently at APEX tier — highest engagement and spend.',
    status: 'active',
    type: 'dynamic',
    conditions: [
      { id: 'c1', field: 'tier', operator: 'eq', value: 'apex' },
    ],
    estimatedSize: 312,
    lastComputedAt: '2026-05-13T12:00:00Z',
    refreshIntervalMinutes: 15,
    tags: ['vip', 'tier'],
    createdBy: 'admin@nectar.internal',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-13T12:00:00Z',
  },
  {
    id: 'seg_new_users',
    name: 'New Users (30-day)',
    description: 'Users who registered within the last 30 days — onboarding funnel targets.',
    status: 'active',
    type: 'dynamic',
    conditions: [
      { id: 'c1', field: 'registration_days_ago', operator: 'lte', value: 30 },
    ],
    estimatedSize: 8940,
    lastComputedAt: '2026-05-13T12:00:00Z',
    refreshIntervalMinutes: 30,
    tags: ['onboarding', 'acquisition'],
    createdBy: 'growth@nectar.internal',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-13T06:00:00Z',
  },
  {
    id: 'seg_streak_holders',
    name: 'Active Streakers',
    description: 'Users currently holding a 7+ day streak. Protect and amplify engagement.',
    status: 'active',
    type: 'dynamic',
    conditions: [
      { id: 'c1', field: 'streak_days', operator: 'gte', value: 7 },
    ],
    estimatedSize: 5621,
    lastComputedAt: '2026-05-13T00:05:00Z',
    refreshIntervalMinutes: 60,
    tags: ['engagement', 'streaks'],
    createdBy: 'ops@nectar.internal',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-05-13T00:05:00Z',
  },
  {
    id: 'seg_referrers',
    name: 'Active Referrers',
    description: 'Users who have made 3+ successful referrals. Core growth engine segment.',
    status: 'active',
    type: 'behavioral',
    conditions: [
      { id: 'c1', field: 'referral_count', operator: 'gte', value: 3 },
      { id: 'c2', field: 'last_active_days_ago', operator: 'lte', value: 14 },
    ],
    estimatedSize: 892,
    lastComputedAt: '2026-05-13T08:00:00Z',
    refreshIntervalMinutes: 60,
    tags: ['growth', 'referrals'],
    createdBy: 'growth@nectar.internal',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-05-13T08:00:00Z',
  },
];

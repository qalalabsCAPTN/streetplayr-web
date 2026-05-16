export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskFlagType =
  | 'velocity_points'
  | 'velocity_events'
  | 'duplicate_wallet'
  | 'referral_fraud'
  | 'bot_signature'
  | 'impossible_timing'
  | 'geo_anomaly'
  | 'unusual_spend'
  | 'account_sharing';

export interface RiskFlag {
  id: string;
  userId: string;
  type: RiskFlagType;
  level: RiskLevel;
  score: number;
  description: string;
  evidence: Record<string, unknown>;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export const RISK_TYPE_LABELS: Record<RiskFlagType, string> = {
  velocity_points:  'Point Velocity',
  velocity_events:  'Event Velocity',
  duplicate_wallet: 'Duplicate Wallet',
  referral_fraud:   'Referral Fraud',
  bot_signature:    'Bot Signature',
  impossible_timing:'Impossible Timing',
  geo_anomaly:      'Geo Anomaly',
  unusual_spend:    'Unusual Spend',
  account_sharing:  'Account Sharing',
};

export const DEMO_RISK_FLAGS: RiskFlag[] = [
  {
    id: 'rf_001',
    userId: 'usr_alpha_001',
    type: 'velocity_points',
    level: 'critical',
    score: 94,
    description: 'Earned 48,200 points in 47 minutes — 9.6× above the 5k/5min threshold.',
    evidence: { windowMinutes: 47, pointsEarned: 48200, threshold: 5000, eventCount: 183 },
    status: 'open',
    createdAt: '2026-05-13T08:14:22Z',
  },
  {
    id: 'rf_002',
    userId: 'usr_bravo_020',
    type: 'referral_fraud',
    level: 'high',
    score: 82,
    description: 'Generated 23 referrals in 4 hours. All from same IP subnet. Possible self-referral ring.',
    evidence: { referralCount: 23, windowHours: 4, uniqueIps: 3, ipSubnet: '10.0.0.0/24' },
    status: 'reviewing',
    createdAt: '2026-05-13T06:30:00Z',
  },
  {
    id: 'rf_003',
    userId: 'usr_charlie_007',
    type: 'duplicate_wallet',
    level: 'high',
    score: 78,
    description: 'Device fingerprint matches 4 distinct accounts. Cross-account activity patterns detected.',
    evidence: { deviceFingerprint: 'fp_abc123', linkedAccountCount: 4, sharedSessions: true },
    status: 'open',
    createdAt: '2026-05-12T22:15:00Z',
  },
  {
    id: 'rf_004',
    userId: 'usr_delta_099',
    type: 'bot_signature',
    level: 'medium',
    score: 67,
    description: 'Event timing is perfectly uniform — 2.0s intervals, 0ms variance.',
    evidence: { avgIntervalMs: 2000, stdDevMs: 0, sampleSize: 85 },
    status: 'open',
    createdAt: '2026-05-13T10:05:00Z',
  },
  {
    id: 'rf_005',
    userId: 'usr_echo_042',
    type: 'impossible_timing',
    level: 'medium',
    score: 55,
    description: 'Order in Mumbai then event in Tokyo 2 minutes later — physically impossible.',
    evidence: { city1: 'Mumbai', city2: 'Tokyo', timeDeltaMin: 2, distanceKm: 5970 },
    status: 'reviewing',
    createdAt: '2026-05-13T09:10:00Z',
  },
  {
    id: 'rf_006',
    userId: 'usr_foxtrot_011',
    type: 'geo_anomaly',
    level: 'low',
    score: 32,
    description: 'User registered in IN, all prior activity from IN, now accessing via VPN exit in NL.',
    evidence: { registrationCountry: 'IN', currentCountry: 'NL', isVpn: true },
    status: 'resolved',
    resolvedBy: 'ops@nectar.internal',
    resolvedAt: '2026-05-12T15:00:00Z',
    createdAt: '2026-05-12T14:30:00Z',
  },
];

export const DEMO_RISK_SUMMARY = {
  openFlags: 4,
  criticalFlags: 1,
  highFlags: 2,
  mediumFlags: 2,
  lowFlags: 1,
  blockedUsers: 1,
  reviewingFlags: 2,
  resolvedToday: 3,
  totalFlagsToday: 12,
};

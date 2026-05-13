import type { RuleId, CampaignId, UserId, NectarPoints, ISO8601 } from './common.js';
import type { EventType } from './events.js';
import type { TierId } from './identity.js';

// ============================================================
// Rewards — rule definitions and execution records
// ============================================================

export type RuleStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type RuleType = 'points' | 'xp' | 'multiplier' | 'badge' | 'drop';

export interface RewardRule {
  id: RuleId;
  name: string;
  description: string;
  status: RuleStatus;
  type: RuleType;
  /** Which event types trigger this rule */
  triggers: EventType[];
  /** Point/XP amount to grant (before multipliers) */
  baseAmount: NectarPoints;
  /** Conditions that must all pass for the rule to apply */
  conditions: RuleCondition[];
  /** How many times a user can trigger this rule */
  maxUsagePerUser?: number;
  /** Cooldown window in seconds */
  cooldownSeconds?: number;
  /** Which tiers are eligible */
  eligibleTiers?: TierId[];
  /** Campaign this rule belongs to, if any */
  campaignId?: CampaignId;
  startsAt?: ISO8601;
  endsAt?: ISO8601;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';

export interface RuleCondition {
  /** Dot-path into the event payload: e.g. "payload.orderTotal" */
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export type ExecutionStatus = 'pending' | 'success' | 'failed' | 'skipped';

/** Immutable record of a reward rule execution attempt */
export interface RewardExecution {
  id: string;
  ruleId: RuleId;
  userId: UserId;
  eventId: string;
  status: ExecutionStatus;
  /** Points actually granted (after multipliers) */
  pointsGranted: NectarPoints;
  xpGranted: NectarPoints;
  /** Applied tier multiplier */
  multiplierApplied: number;
  /** Validation check results */
  validationResults: ValidationCheckResult[];
  transactionId?: string;
  failureReason?: string;
  idempotencyKey: string;
  createdAt: ISO8601;
}

export interface ValidationCheckResult {
  checkName: string;
  passed: boolean;
  reason?: string;
}

export interface Campaign {
  id: CampaignId;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  rules: RuleId[];
  globalMultiplier?: number;
  startsAt: ISO8601;
  endsAt?: ISO8601;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

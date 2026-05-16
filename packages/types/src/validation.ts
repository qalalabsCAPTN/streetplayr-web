import type { UserId } from './common.js';
import type { NectarEvent } from './events.js';

// ============================================================
// Validation — middleware pipeline types
// Every reward execution passes through this pipeline.
// ============================================================

export type ValidatorName =
  | 'identity'
  | 'usage'
  | 'cooldown'
  | 'threshold'
  | 'fraud'
  | 'tier'
  | 'segmentation'
  | 'blacklist'
  | 'rate_limit';

export type ValidationOutcome = 'pass' | 'fail' | 'warn';

export interface ValidatorResult {
  validator: ValidatorName;
  outcome: ValidationOutcome;
  reason?: string;
  /** Structured context for observability */
  context?: Record<string, unknown>;
}

export interface ValidationContext {
  userId: UserId;
  event: NectarEvent;
  ruleId: string;
}

export interface ValidationPipelineResult {
  passed: boolean;
  results: ValidatorResult[];
  /** First failed validator, if any */
  failedAt?: ValidatorName;
  failureReason?: string;
}

export interface Validator {
  name: ValidatorName;
  validate(ctx: ValidationContext): Promise<ValidatorResult>;
}

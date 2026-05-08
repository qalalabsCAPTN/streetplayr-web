/**
 * Operational Event Timeline Service
 *
 * Immutable event log for all orchestration actions.
 * Provides a human-observable timeline for OpsOS.
 * Every state transition, failure, and system action is recorded.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { OperationalEvent, EventDomain, EventSeverity } from './types';

export async function recordEvent(params: {
  domain: EventDomain;
  severity: EventSeverity;
  action: string;
  actorId?: string;
  resourceType: string;
  resourceId: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('operational_events').insert({
      domain: params.domain,
      severity: params.severity,
      action: params.action,
      actor_id: params.actorId ?? 'system',
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      message: params.message,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    // Event logging must never crash the calling operation.
    // Log to console as fallback.
    console.error('[Events] Failed to record event:', params.action, e);
  }
}

export const EventTimeline = {
  /**
   * Query events with filters.
   */
  async query(params: {
    domain?: EventDomain;
    severity?: EventSeverity;
    resourceType?: string;
    resourceId?: string;
    actorId?: string;
    limit?: number;
    offset?: number;
    since?: string;
  } = {}): Promise<OperationalEvent[]> {
    try {
      const admin = createAdminClient();
      let query = admin.from('operational_events').select('*');

      if (params.domain) query = query.eq('domain', params.domain);
      if (params.severity) query = query.eq('severity', params.severity);
      if (params.resourceType) query = query.eq('resource_type', params.resourceType);
      if (params.resourceId) query = query.eq('resource_id', params.resourceId);
      if (params.actorId) query = query.eq('actor_id', params.actorId);
      if (params.since) query = query.gte('created_at', params.since);

      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(params.limit ?? 50)
        .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

      return (data ?? []).map((row: any) => ({
        id: row.id,
        domain: row.domain,
        severity: row.severity,
        action: row.action,
        actorId: row.actor_id,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        metadata: row.metadata ?? {},
        message: row.message,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get recent events for a specific resource.
   */
  async forResource(resourceType: string, resourceId: string, limit = 20): Promise<OperationalEvent[]> {
    return this.query({ resourceType, resourceId, limit });
  },

  /**
   * Get recent errors and warnings.
   */
  async getErrors(limit = 20): Promise<OperationalEvent[]> {
    return this.query({
      severity: 'error',
      limit,
    });
  },
};

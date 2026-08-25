/**
 * NECTAR event bridge — server-only client for POST /v1/events.
 *
 * This is StreetPlayR's half of the previously-nonexistent
 * StreetPlayR <-> NECTAR integration (see ECOSYSTEM_CONTRACTS.md §0).
 * It does exactly one thing: hand a business event to NECTAR's event
 * ingestion API, authenticated the way NECTAR's
 * apps/api/src/middleware/auth.ts actually expects.
 *
 * NEVER import this from client components — the signing secret must
 * never reach the browser. Every call site is a server action / route
 * handler / orchestration-layer function.
 */
import { createHmac, randomUUID } from 'crypto';

export interface NectarEventEnvelope {
  eventId: string;
  eventType: string;
  version: number;
  timestamp: string;
  actorUserId: string;
  platform: string;
  platformTraceId?: string;
  payload: Record<string, unknown>;
}

export interface EmitEventResult {
  ok: boolean;
  status?: 'queued' | 'duplicate';
  error?: string;
}

const NECTAR_PLATFORM_ID = 'streetplayr';

function getConfig(): { baseUrl: string; token: string } | null {
  // NECTAR_API_URL (server-only) takes precedence; NEXT_PUBLIC_NECTAR_API_URL
  // is accepted as a fallback since it's already set in .env.local from
  // earlier work — the URL itself isn't sensitive, only the signing secret,
  // which must NEVER be a NEXT_PUBLIC_ var.
  const baseUrl = process.env.NECTAR_API_URL ?? process.env.NEXT_PUBLIC_NECTAR_API_URL;
  // PLATFORM_TOKEN_STREETPLAYR was already present in .env.local from
  // earlier integration work — same value NECTAR's `platforms.signing_secret`
  // holds for platform id 'streetplayr'. NECTAR_SIGNING_SECRET is the
  // preferred name going forward; both are accepted.
  const token = process.env.NECTAR_SIGNING_SECRET ?? process.env.PLATFORM_TOKEN_STREETPLAYR;
  if (!baseUrl || !token) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

/**
 * Builds a canonical purchase.completed (or any other) event envelope.
 * `eventId` defaults to a fresh UUID — pass one explicitly if the
 * caller already has a natural idempotent key (e.g. reuse the order id
 * for a 1:1 order->event relationship) to make retries idempotent at
 * the NECTAR ingestion layer as well as at the caller's layer.
 */
export function buildEvent(params: {
  eventType: string;
  actorUserId: string;
  payload: Record<string, unknown>;
  eventId?: string;
  platformTraceId?: string;
}): NectarEventEnvelope {
  return {
    eventId: params.eventId ?? randomUUID(),
    eventType: params.eventType,
    version: 1,
    timestamp: new Date().toISOString(),
    actorUserId: params.actorUserId,
    platform: NECTAR_PLATFORM_ID,
    platformTraceId: params.platformTraceId,
    payload: params.payload,
  };
}

/**
 * Emit an event to NECTAR's POST /v1/events. Never throws — mirrors
 * lib/orchestration/events.ts's recordEvent() convention: a NECTAR
 * outage must never break the caller's business transaction (the
 * order is already confirmed/paid by the time this fires). Failures
 * are logged; nothing here retries or queues — see
 * PURCHASE_COMPLETED_CONTRACT.md "Delivery guarantee" for the
 * documented at-least-once caveat and what it would take to close it.
 */
export async function emitEvent(event: NectarEventEnvelope): Promise<EmitEventResult> {
  const config = getConfig();
  if (!config) {
    console.warn('[nectar] NECTAR_API_URL / NECTAR_SIGNING_SECRET not configured — skipping event emit', {
      eventType: event.eventType,
      eventId: event.eventId,
    });
    return { ok: false, error: 'NECTAR not configured' };
  }

  const body = JSON.stringify(event);
  const signature = 'sha256=' + createHmac('sha256', config.token).update(body).digest('hex');

  try {
    const res = await fetch(`${config.baseUrl}/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Nectar-Platform': NECTAR_PLATFORM_ID,
        'X-Nectar-Token': config.token,
        'X-Nectar-Signature': signature,
      },
      body,
      // Never let a slow/hanging NECTAR call block the caller indefinitely.
      signal: AbortSignal.timeout(5000),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('[nectar] emitEvent failed', {
        eventType: event.eventType,
        eventId: event.eventId,
        status: res.status,
        body: json,
      });
      return { ok: false, error: json?.error?.message ?? `HTTP ${res.status}` };
    }

    return { ok: true, status: json?.data?.status };
  } catch (e) {
    console.error('[nectar] emitEvent network error', {
      eventType: event.eventType,
      eventId: event.eventId,
      error: e instanceof Error ? e.message : e,
    });
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

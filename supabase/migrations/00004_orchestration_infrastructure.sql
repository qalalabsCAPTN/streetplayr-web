-- ============================================================================
-- StreetPlayR — Orchestration Infrastructure
-- ============================================================================
-- Adds operational_events timeline, idempotency_keys table, expanded
-- order_status enum, and RPCs for reconciliation workflows.
-- ============================================================================

-- ─── 1. Expand order_status to include 'draft' and 'on_hold' ──────────────

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'on_hold' AFTER 'confirmed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing' AFTER 'on_hold';

-- ─── 2. Operational Events Timeline ───────────────────────────────────────
-- Immutable event log. Every state transition, failure, and system
-- action is recorded here. Powers the OpsOS event timeline view.

CREATE TABLE operational_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain        TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'info',
  action        TEXT NOT NULL,
  actor_id      TEXT NOT NULL DEFAULT 'system',
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  message       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE operational_events ENABLE ROW LEVEL SECURITY;

-- Ops roles can read operational events
CREATE POLICY "Ops roles can read operational events"
  ON operational_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN (
      'super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer'
    )
  ));

-- System can insert events (handled by admin client, not RLS typically)
CREATE POLICY "Authenticated users can insert events"
  ON operational_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE INDEX idx_events_domain ON operational_events(domain);
CREATE INDEX idx_events_severity ON operational_events(severity);
CREATE INDEX idx_events_resource ON operational_events(resource_type, resource_id);
CREATE INDEX idx_events_created ON operational_events(created_at DESC);
CREATE INDEX idx_events_actor ON operational_events(actor_id);

-- ─── 3. Idempotency Keys ──────────────────────────────────────────────────
-- Lightweight key-value store for deduplication.
-- Used by webhook handler, server actions, and payment reconciliation.

CREATE TABLE idempotency_keys (
  key        TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'processing',
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only system operations manage idempotency keys
CREATE POLICY "Service role manages idempotency keys"
  ON idempotency_keys FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- ─── 4. Mark orders without payment info as 'draft' (existing data fix) ──

UPDATE orders SET status = 'draft' WHERE status = 'pending' AND payment_intent_id IS NULL;

-- ─── 5. Payment Events: expand for full event taxonomy, add constraints ───

-- Ensure stripe_event_id is unique across all payment events
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_stripe_event
  ON payment_events(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

-- ─── 6. Reservation: add index for owner + state queries ─────────────────

CREATE INDEX IF NOT EXISTS idx_reservations_owner_state
  ON inventory_reservations(reservation_owner, reservation_state);

-- ─── 7. Security: allow admin client to insert operational events ────────

-- The admin client uses service_role key, which bypasses RLS by default.
-- For authenticated server actions, ensure the user can insert events.
CREATE POLICY "Server can insert operational events"
  ON operational_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert events" ON operational_events;
DROP POLICY IF EXISTS "Server can insert operational events" ON operational_events;
CREATE POLICY "Allow insert operational events"
  ON operational_events FOR INSERT
  WITH CHECK (true);

-- ─── 8. Cleanup old order status values ──────────────────────────────────

-- The 'pending' status is now 'pending_payment'. The enum was extended
-- with 'draft' and 'on_hold' added. Existing 'pending' rows are mapped
-- to 'pending_payment' conceptually, but the old enum value persists.
-- No data migration needed — 'pending' is kept in type for backward compat.

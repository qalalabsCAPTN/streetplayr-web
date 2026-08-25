-- ============================================================================
-- Payment Events — reconciled against LIVE DATABASE, not prior migration
-- files (verified via pg_dump + application code, see audit trail).
-- Additive only: no drops, no destructive alters, no existing-table writes.
-- ============================================================================

-- 1. orders: add the missing transaction-reference column used by both the
--    Stripe and Easebuzz webhook paths (PaymentService.processWebhookEvent
--    looks orders up by this column).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
  ON public.orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- 2. payment_events: matches the exact insert contract in
--    lib/orchestration/payment.ts (order_id, event_type, stripe_event_id,
--    stripe_payment_intent_id, amount, currency, raw_payload).
--    `payment_event_type` already exists live and matches the app's
--    PaymentEventType union exactly — reused, not recreated.
CREATE TABLE IF NOT EXISTS public.payment_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type                payment_event_type,
  stripe_event_id           TEXT,
  stripe_payment_intent_id  TEXT,
  amount                    INTEGER NOT NULL CHECK (amount >= 0),
  currency                  TEXT DEFAULT 'usd',
  raw_payload               JSONB DEFAULT '{}'::jsonb,
  metadata                  JSONB DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order
  ON public.payment_events(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_intent
  ON public.payment_events(stripe_payment_intent_id);

-- Provider-agnostic idempotency: same (provider, txn, event_type)-derived
-- key can never be inserted twice. Verified sufficient for Stripe
-- success/failure and Easebuzz success/failure/pending/cancellation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_stripe_event
  ON public.payment_events(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

-- Extra backstop specifically for "succeeded" events.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_order_success
  ON public.payment_events(order_id, event_type)
  WHERE event_type = 'payment_intent.succeeded';

-- 3. RLS — ops/staff read access only, mirrors the VERIFIED live "orders"
--    policy (memberships.user_id = auth.uid() -> organization_id). No
--    shopper-facing policy: no verified customer<->auth relationship exists
--    for that (see audit trail). No client INSERT/UPDATE/DELETE policy —
--    all writes go through the service-role admin client (server-only).
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view payment events for their org's orders" ON public.payment_events;
CREATE POLICY "Org members can view payment events for their org's orders"
  ON public.payment_events FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE o.organization_id IN (
        SELECT m.organization_id FROM public.memberships m WHERE m.user_id = auth.uid()
      )
    )
  );

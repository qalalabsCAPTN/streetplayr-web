-- Shared rate-limit buckets for serverless checkout/auth mutations.
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  IF p_key IS NULL OR p_key = '' OR p_limit IS NULL OR p_limit <= 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limit_buckets(key, count, reset_at)
  VALUES (p_key, 1, now() + make_interval(secs => GREATEST(p_window_seconds, 1)))
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN public.rate_limit_buckets.reset_at <= now() THEN 1
          ELSE public.rate_limit_buckets.count + 1
        END,
        reset_at = CASE
          WHEN public.rate_limit_buckets.reset_at <= now()
            THEN now() + make_interval(secs => GREATEST(p_window_seconds, 1))
          ELSE public.rate_limit_buckets.reset_at
        END
  RETURNING count, reset_at INTO v_count, v_reset;

  RETURN v_count <= p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_order
  ON public.coupon_redemptions(order_id)
  WHERE order_id IS NOT NULL;

DROP POLICY IF EXISTS "users read own coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "users read own coupon redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (user_id = auth.uid());

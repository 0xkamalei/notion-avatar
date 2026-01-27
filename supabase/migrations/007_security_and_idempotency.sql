-- Stripe webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage all stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can manage all stripe webhook events" ON public.stripe_webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_packages_stripe_payment_intent_id
  ON public.credit_packages (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  credits_awarded INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  max_redemptions INTEGER NOT NULL DEFAULT 20,
  redemptions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (credits_awarded > 0),
  CHECK (max_redemptions >= 0),
  CHECK (redemptions_count >= 0)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage all promo codes" ON public.promo_codes;
CREATE POLICY "Service role can manage all promo codes" ON public.promo_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.promo_codes (code, credits_awarded, expires_at, max_redemptions)
VALUES
  ('XKZQWM', 10, '2026-01-31', 20),
  ('PLRTYN', 10, '2026-01-31', 20),
  ('VBNMGH', 10, '2026-01-31', 20)
ON CONFLICT (code) DO UPDATE SET
  credits_awarded = EXCLUDED.credits_awarded,
  expires_at = EXCLUDED.expires_at,
  max_redemptions = EXCLUDED.max_redemptions;

UPDATE public.promo_codes pc
SET redemptions_count = sub.cnt
FROM (
  SELECT promo_code, COUNT(*)::INTEGER AS cnt
  FROM public.promo_redemptions
  GROUP BY promo_code
) sub
WHERE pc.code = sub.promo_code;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  p_user_id UUID,
  p_promo_code TEXT
)
RETURNS INTEGER AS $$
DECLARE
  normalized_code TEXT := UPPER(TRIM(p_promo_code));
  credits INTEGER;
BEGIN
  IF normalized_code IS NULL OR normalized_code = '' THEN
    RAISE EXCEPTION 'Invalid promo code' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.promo_redemptions (user_id, promo_code, credits_awarded)
  SELECT p_user_id, normalized_code, pc.credits_awarded
  FROM public.promo_codes pc
  WHERE pc.code = normalized_code
    AND (pc.expires_at IS NULL OR NOW() <= pc.expires_at)
  ON CONFLICT (user_id, promo_code) DO NOTHING;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1
      FROM public.promo_redemptions
      WHERE user_id = p_user_id AND promo_code = normalized_code
    ) THEN
      RAISE EXCEPTION 'Promo code already redeemed' USING ERRCODE = 'P0001';
    END IF;
    RAISE EXCEPTION 'Invalid promo code' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.promo_codes
  SET redemptions_count = redemptions_count + 1
  WHERE code = normalized_code
    AND (expires_at IS NULL OR NOW() <= expires_at)
    AND redemptions_count < max_redemptions
  RETURNING credits_awarded INTO credits;

  IF credits IS NULL THEN
    RAISE EXCEPTION 'Promo code redemption limit reached' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.credit_packages (
    user_id,
    credits_purchased,
    credits_remaining,
    stripe_payment_intent_id
  )
  VALUES (
    p_user_id,
    credits,
    credits,
    'promo_' || normalized_code || '_' || gen_random_uuid()::text
  );

  RETURN credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;

ALTER FUNCTION public.try_consume_site_free_usage(DATE, INTEGER)
  SET search_path = public, extensions;
ALTER FUNCTION public.refund_site_free_usage(DATE)
  SET search_path = public, extensions;
ALTER FUNCTION public.consume_user_credits(UUID, INTEGER)
  SET search_path = public, extensions;
ALTER FUNCTION public.refund_user_credits(UUID, INTEGER)
  SET search_path = public, extensions;
ALTER FUNCTION public.try_consume_user_free_usage(UUID, DATE, INTEGER, INTEGER)
  SET search_path = public, extensions;
ALTER FUNCTION public.refund_user_free_usage(UUID, DATE)
  SET search_path = public, extensions;
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, extensions;
ALTER FUNCTION public.increment_daily_usage(UUID, DATE)
  SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.try_consume_site_free_usage(DATE, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_site_free_usage(DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_user_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_user_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.try_consume_user_free_usage(UUID, DATE, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_user_free_usage(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_daily_usage(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_promo_code(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.try_consume_site_free_usage(DATE, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_site_free_usage(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_user_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.try_consume_user_free_usage(UUID, DATE, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_user_free_usage(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(UUID, TEXT) TO service_role;

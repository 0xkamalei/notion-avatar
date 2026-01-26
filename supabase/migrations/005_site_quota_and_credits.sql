CREATE TABLE IF NOT EXISTS public.site_daily_usage (
  usage_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage all site daily usage" ON public.site_daily_usage;
CREATE POLICY "Service role can manage all site daily usage" ON public.site_daily_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE OR REPLACE FUNCTION public.try_consume_site_free_usage(
  p_date DATE,
  p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  INSERT INTO public.site_daily_usage (usage_date, count)
  VALUES (p_date, 0)
  ON CONFLICT (usage_date) DO NOTHING;

  UPDATE public.site_daily_usage
  SET count = count + 1
  WHERE usage_date = p_date AND count < p_limit;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.refund_site_free_usage(
  p_date DATE
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.site_daily_usage
  SET count = GREATEST(0, count - 1)
  WHERE usage_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.consume_user_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  remaining INTEGER := p_amount;
  pkg RECORD;
BEGIN
  IF p_amount <= 0 THEN
    RETURN TRUE;
  END IF;

  FOR pkg IN
    SELECT id, credits_remaining
    FROM public.credit_packages
    WHERE user_id = p_user_id AND credits_remaining > 0
    ORDER BY purchased_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN remaining <= 0;

    IF pkg.credits_remaining >= remaining THEN
      UPDATE public.credit_packages
      SET credits_remaining = credits_remaining - remaining
      WHERE id = pkg.id;
      remaining := 0;
    ELSE
      UPDATE public.credit_packages
      SET credits_remaining = 0
      WHERE id = pkg.id;
      remaining := remaining - pkg.credits_remaining;
    END IF;
  END LOOP;

  RETURN remaining = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.refund_user_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID AS $$
DECLARE
  pkg_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RETURN;
  END IF;

  SELECT id INTO pkg_id
  FROM public.credit_packages
  WHERE user_id = p_user_id
  ORDER BY purchased_at DESC
  LIMIT 1;

  IF pkg_id IS NULL THEN
    INSERT INTO public.credit_packages (user_id, credits_purchased, credits_remaining)
    VALUES (p_user_id, 0, p_amount);
  ELSE
    UPDATE public.credit_packages
    SET credits_remaining = credits_remaining + p_amount
    WHERE id = pkg_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.usage_records
  ADD COLUMN IF NOT EXISTS credits_charged INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS used_free BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_usage_records_used_free ON public.usage_records(used_free);

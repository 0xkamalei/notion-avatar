CREATE OR REPLACE FUNCTION public.try_consume_user_free_usage(
  p_user_id UUID,
  p_date DATE,
  p_user_limit INTEGER,
  p_site_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_count INTEGER;
  current_site_count INTEGER;
BEGIN
  INSERT INTO public.daily_usage (user_id, usage_date, count)
  VALUES (p_user_id, p_date, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  INSERT INTO public.site_daily_usage (usage_date, count)
  VALUES (p_date, 0)
  ON CONFLICT (usage_date) DO NOTHING;

  SELECT count
  INTO current_user_count
  FROM public.daily_usage
  WHERE user_id = p_user_id AND usage_date = p_date
  FOR UPDATE;

  SELECT count
  INTO current_site_count
  FROM public.site_daily_usage
  WHERE usage_date = p_date
  FOR UPDATE;

  IF current_user_count < p_user_limit AND current_site_count < p_site_limit THEN
    UPDATE public.daily_usage
    SET count = count + 1
    WHERE user_id = p_user_id AND usage_date = p_date;

    UPDATE public.site_daily_usage
    SET count = count + 1
    WHERE usage_date = p_date;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.refund_user_free_usage(
  p_user_id UUID,
  p_date DATE
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.daily_usage
  SET count = GREATEST(0, count - 1)
  WHERE user_id = p_user_id AND usage_date = p_date;

  UPDATE public.site_daily_usage
  SET count = GREATEST(0, count - 1)
  WHERE usage_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


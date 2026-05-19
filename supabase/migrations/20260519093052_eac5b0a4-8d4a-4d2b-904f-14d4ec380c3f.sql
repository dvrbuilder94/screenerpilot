
CREATE TABLE IF NOT EXISTS public.daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date date NOT NULL UNIQUE,
  headline text NOT NULL,
  content_md text NOT NULL,
  regimes jsonb,
  top_movers jsonb,
  key_events jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_briefings_date ON public.daily_briefings (briefing_date DESC);

ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily_briefings"
  ON public.daily_briefings FOR SELECT
  USING (true);

CREATE POLICY "Deny public INSERT on daily_briefings"
  ON public.daily_briefings FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on daily_briefings"
  ON public.daily_briefings FOR UPDATE
  USING (false);

CREATE POLICY "Deny public DELETE on daily_briefings"
  ON public.daily_briefings FOR DELETE
  USING (false);

CREATE TRIGGER update_daily_briefings_updated_at
  BEFORE UPDATE ON public.daily_briefings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

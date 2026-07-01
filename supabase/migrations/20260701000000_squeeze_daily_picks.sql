-- Stores the top squeeze picks saved each day with entry price,
-- and fills in next-day close price + % move once available.
CREATE TABLE IF NOT EXISTS public.squeeze_daily_picks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_date     date NOT NULL,
  rank          integer NOT NULL,
  symbol        text NOT NULL,
  company_name  text,
  squeeze_score integer NOT NULL,
  volume_ratio  numeric,
  change_5d     numeric,
  price_at_pick numeric NOT NULL,
  price_next_day numeric,
  change_pct    numeric,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pick_date, symbol)
);

CREATE INDEX IF NOT EXISTS squeeze_daily_picks_date_idx ON public.squeeze_daily_picks (pick_date DESC);

ALTER TABLE public.squeeze_daily_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read squeeze picks"
  ON public.squeeze_daily_picks FOR SELECT USING (true);

CREATE POLICY "Deny public write on squeeze picks"
  ON public.squeeze_daily_picks FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny public update on squeeze picks"
  ON public.squeeze_daily_picks FOR UPDATE USING (false);

CREATE TRIGGER update_squeeze_daily_picks_updated_at
  BEFORE UPDATE ON public.squeeze_daily_picks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

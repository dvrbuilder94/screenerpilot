-- Enable extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Market snapshots table for macro intelligence
CREATE TABLE public.market_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  region TEXT,
  current_price NUMERIC,
  previous_close NUMERIC,
  change_1d NUMERIC,
  change_pct_1d NUMERIC,
  change_pct_1w NUMERIC,
  change_pct_1m NUMERIC,
  change_pct_ytd NUMERIC,
  change_pct_1y NUMERIC,
  volume NUMERIC,
  market_cap NUMERIC,
  raw_data JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT market_snapshots_symbol_unique UNIQUE (symbol)
);

CREATE INDEX idx_market_snapshots_category ON public.market_snapshots(category);
CREATE INDEX idx_market_snapshots_region ON public.market_snapshots(region);
CREATE INDEX idx_market_snapshots_fetched_at ON public.market_snapshots(fetched_at DESC);

ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market_snapshots"
  ON public.market_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Deny public INSERT on market_snapshots"
  ON public.market_snapshots FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on market_snapshots"
  ON public.market_snapshots FOR UPDATE
  USING (false);

CREATE POLICY "Deny public DELETE on market_snapshots"
  ON public.market_snapshots FOR DELETE
  USING (false);

CREATE TRIGGER market_snapshots_updated_at
  BEFORE UPDATE ON public.market_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
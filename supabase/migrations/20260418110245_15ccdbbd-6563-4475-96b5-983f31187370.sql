CREATE TABLE public.ratio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ratio_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  numerator_symbol TEXT NOT NULL,
  denominator_symbol TEXT NOT NULL,
  current_value NUMERIC,
  mean_5y NUMERIC,
  std_5y NUMERIC,
  min_5y NUMERIC,
  max_5y NUMERIC,
  percentile_5y NUMERIC,
  z_score NUMERIC,
  change_pct_1d NUMERIC,
  change_pct_1w NUMERIC,
  change_pct_1m NUMERIC,
  change_pct_3m NUMERIC,
  history_90d JSONB,
  notes TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ratio_snapshots_category ON public.ratio_snapshots(category);

ALTER TABLE public.ratio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratio_snapshots"
  ON public.ratio_snapshots FOR SELECT USING (true);
CREATE POLICY "Deny public INSERT on ratio_snapshots"
  ON public.ratio_snapshots FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on ratio_snapshots"
  ON public.ratio_snapshots FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on ratio_snapshots"
  ON public.ratio_snapshots FOR DELETE USING (false);

CREATE TRIGGER update_ratio_snapshots_updated_at
  BEFORE UPDATE ON public.ratio_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
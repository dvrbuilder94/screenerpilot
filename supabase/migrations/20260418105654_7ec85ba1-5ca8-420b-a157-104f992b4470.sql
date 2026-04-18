CREATE TABLE public.macro_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT,
  current_value NUMERIC,
  previous_value NUMERIC,
  change_value NUMERIC,
  change_pct NUMERIC,
  observation_date DATE,
  frequency TEXT,
  unit TEXT,
  history JSONB,
  notes TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_macro_indicators_category ON public.macro_indicators(category);
CREATE INDEX idx_macro_indicators_country ON public.macro_indicators(country);

ALTER TABLE public.macro_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read macro_indicators"
  ON public.macro_indicators FOR SELECT USING (true);

CREATE POLICY "Deny public INSERT on macro_indicators"
  ON public.macro_indicators FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on macro_indicators"
  ON public.macro_indicators FOR UPDATE USING (false);

CREATE POLICY "Deny public DELETE on macro_indicators"
  ON public.macro_indicators FOR DELETE USING (false);

CREATE TRIGGER update_macro_indicators_updated_at
  BEFORE UPDATE ON public.macro_indicators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE IF NOT EXISTS public.ben_top_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_date date NOT NULL,
  rank integer NOT NULL,
  symbol text NOT NULL,
  company_name text,
  price numeric,
  squeeze_score integer,
  change_5d numeric,
  volume_ratio numeric,
  conviction text NOT NULL,
  thesis text NOT NULL,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pick_date, rank),
  UNIQUE (pick_date, symbol)
);

CREATE INDEX IF NOT EXISTS idx_ben_top_picks_date ON public.ben_top_picks (pick_date DESC, rank);

ALTER TABLE public.ben_top_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ben_top_picks"
  ON public.ben_top_picks FOR SELECT
  USING (true);

CREATE POLICY "Deny public INSERT on ben_top_picks"
  ON public.ben_top_picks FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on ben_top_picks"
  ON public.ben_top_picks FOR UPDATE
  USING (false);

CREATE POLICY "Deny public DELETE on ben_top_picks"
  ON public.ben_top_picks FOR DELETE
  USING (false);

CREATE TRIGGER update_ben_top_picks_updated_at
  BEFORE UPDATE ON public.ben_top_picks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

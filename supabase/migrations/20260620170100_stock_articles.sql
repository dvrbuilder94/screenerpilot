CREATE TABLE IF NOT EXISTS public.stock_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  article_date date NOT NULL,
  company_name text,
  headline text NOT NULL,
  content_md text NOT NULL,
  squeeze_score integer,
  price numeric,
  change_5d numeric,
  volume_ratio numeric,
  market_cap_label text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (symbol, article_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_articles_symbol ON public.stock_articles (symbol);
CREATE INDEX IF NOT EXISTS idx_stock_articles_date ON public.stock_articles (article_date DESC);

ALTER TABLE public.stock_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stock_articles"
  ON public.stock_articles FOR SELECT
  USING (true);

CREATE POLICY "Deny public INSERT on stock_articles"
  ON public.stock_articles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public UPDATE on stock_articles"
  ON public.stock_articles FOR UPDATE
  USING (false);

CREATE POLICY "Deny public DELETE on stock_articles"
  ON public.stock_articles FOR DELETE
  USING (false);

CREATE TRIGGER update_stock_articles_updated_at
  BEFORE UPDATE ON public.stock_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table: sentiment_votes
CREATE TABLE public.sentiment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  user_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('bullish', 'bearish')),
  vote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One vote per user per symbol per day
CREATE UNIQUE INDEX idx_sentiment_votes_unique 
  ON public.sentiment_votes (user_id, symbol, vote_date);

-- Index for aggregation queries
CREATE INDEX idx_sentiment_votes_symbol_date ON public.sentiment_votes (symbol, vote_date);

-- RLS for sentiment_votes
ALTER TABLE public.sentiment_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sentiment votes" ON public.sentiment_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert sentiment votes" ON public.sentiment_votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Table: price_expectations
CREATE TABLE public.price_expectations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  user_id UUID NOT NULL,
  target_price NUMERIC NOT NULL,
  target_month TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_price NUMERIC,
  error_pct NUMERIC
);

-- One expectation per user per symbol per month
CREATE UNIQUE INDEX idx_price_expectations_unique 
  ON public.price_expectations (user_id, symbol, target_month);

-- Index for aggregation queries
CREATE INDEX idx_price_expectations_symbol_month ON public.price_expectations (symbol, target_month);

-- RLS for price_expectations
ALTER TABLE public.price_expectations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read price expectations" ON public.price_expectations FOR SELECT USING (true);
CREATE POLICY "Auth users can insert price expectations" ON public.price_expectations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
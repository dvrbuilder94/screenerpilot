-- Create user watchlists table for persistent watchlist per user
CREATE TABLE user_watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'index', 'etf')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own watchlist"
  ON user_watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own watchlist"
  ON user_watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist"
  ON user_watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_user_watchlists_user_id ON user_watchlists(user_id);
-- ============================================
-- SYSTEM TRACK RECORD FOUNDATION
-- Immutable signal snapshots and outcome tracking
-- ============================================

-- Table: signal_snapshots (immutable, append-only)
CREATE TABLE public.signal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  signal TEXT NOT NULL,
  score NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  price_at_signal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups and aggregations
CREATE INDEX idx_signal_snapshots_lookup 
  ON public.signal_snapshots (symbol, timeframe, created_at DESC);

CREATE INDEX idx_signal_snapshots_signal 
  ON public.signal_snapshots (signal, timeframe, created_at DESC);

CREATE INDEX idx_signal_snapshots_asset_type
  ON public.signal_snapshots (asset_type, created_at DESC);

-- Table: signal_outcomes (immutable, one per snapshot+horizon)
CREATE TABLE public.signal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES public.signal_snapshots(id) ON DELETE RESTRICT,
  horizon TEXT NOT NULL,
  start_price NUMERIC NOT NULL,
  end_price NUMERIC NOT NULL,
  return_pct NUMERIC NOT NULL,
  max_drawdown NUMERIC NOT NULL,
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(snapshot_id, horizon)
);

-- Indexes for outcome queries
CREATE INDEX idx_signal_outcomes_snapshot 
  ON public.signal_outcomes (snapshot_id);

CREATE INDEX idx_signal_outcomes_horizon 
  ON public.signal_outcomes (horizon, resolved_at DESC);

CREATE INDEX idx_signal_outcomes_resolved 
  ON public.signal_outcomes (resolved_at DESC);

-- Enable RLS
ALTER TABLE public.signal_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read, no one can update/delete (service role bypasses for inserts)
CREATE POLICY "Anyone can read signal snapshots"
  ON public.signal_snapshots
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read signal outcomes"
  ON public.signal_outcomes
  FOR SELECT
  USING (true);
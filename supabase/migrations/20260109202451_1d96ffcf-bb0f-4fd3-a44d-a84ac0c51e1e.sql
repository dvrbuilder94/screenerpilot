-- ============================================
-- HIDDEN GEMS MODULE - DATABASE SCHEMA
-- ============================================

-- 1. STOCK UNIVERSE TABLE (Dynamic universe)
CREATE TABLE public.stock_universe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT,
  sector TEXT,
  industry TEXT,
  country TEXT DEFAULT 'US',
  market_cap NUMERIC,
  avg_volume_90d NUMERIC,
  current_price NUMERIC,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_universe_market_cap ON public.stock_universe (market_cap);
CREATE INDEX idx_universe_active ON public.stock_universe (is_active) WHERE is_active = true;
CREATE INDEX idx_universe_country ON public.stock_universe (country);

-- 2. STOCK FUNDAMENTALS TABLE (Quarterly data)
CREATE TABLE public.stock_fundamentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  fiscal_quarter TEXT NOT NULL,
  
  -- Income Statement
  revenue NUMERIC,
  ebitda NUMERIC,
  operating_income NUMERIC,
  net_income NUMERIC,
  
  -- Balance Sheet
  total_debt NUMERIC,
  cash_and_equivalents NUMERIC,
  total_equity NUMERIC,
  shares_outstanding NUMERIC,
  current_assets NUMERIC,
  current_liabilities NUMERIC,
  
  -- Cash Flow
  operating_cash_flow NUMERIC,
  capital_expenditures NUMERIC,
  free_cash_flow NUMERIC,
  
  -- Valuation
  enterprise_value NUMERIC,
  ev_ebitda NUMERIC,
  price_sales NUMERIC,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(symbol, fiscal_quarter)
);

CREATE INDEX idx_fundamentals_symbol ON public.stock_fundamentals (symbol);
CREATE INDEX idx_fundamentals_quarter ON public.stock_fundamentals (fiscal_quarter DESC);

-- 3. HIDDEN GEMS SCORES TABLE (Frontend-facing, lightweight)
CREATE TABLE public.hidden_gems_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT,
  sector TEXT,
  market_cap NUMERIC,
  
  -- Composite Score
  hidden_gem_score NUMERIC NOT NULL,
  previous_score NUMERIC,
  
  -- Component Scores (0-100)
  fundamentals_score NUMERIC NOT NULL,
  valuation_score NUMERIC NOT NULL,
  balance_sheet_score NUMERIC NOT NULL,
  price_structure_score NUMERIC NOT NULL,
  market_neglect_score NUMERIC NOT NULL,
  
  -- Human-readable explanation
  explanation TEXT NOT NULL,
  
  -- Metadata
  rank INTEGER,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gems_score ON public.hidden_gems_scores (hidden_gem_score DESC);
CREATE INDEX idx_gems_rank ON public.hidden_gems_scores (rank ASC);

-- 4. HIDDEN GEMS METRICS TABLE (Debug/internal only)
CREATE TABLE public.hidden_gems_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  
  -- Raw Signals (pre-percentile)
  revenue_growth_qoq NUMERIC,
  margin_improvement_qoq NUMERIC,
  fcf_delta_qoq NUMERIC,
  ev_ebitda NUMERIC,
  price_sales NUMERIC,
  net_debt_ebitda NUMERIC,
  current_ratio NUMERIC,
  shares_diluted BOOLEAN DEFAULT false,
  trend_slope NUMERIC,
  atr_percentile NUMERIC,
  volume_rank NUMERIC,
  
  -- Percentile Ranks (cross-sectional)
  revenue_growth_pctl NUMERIC,
  margin_improvement_pctl NUMERIC,
  fcf_delta_pctl NUMERIC,
  valuation_pctl NUMERIC,
  balance_sheet_pctl NUMERIC,
  price_structure_pctl NUMERIC,
  neglect_pctl NUMERIC,
  
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_metrics_symbol ON public.hidden_gems_metrics (symbol);

-- ============================================
-- RLS POLICIES - Read-only public access
-- ============================================

ALTER TABLE public.stock_universe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_fundamentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_gems_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_gems_metrics ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Anyone can read stock_universe" ON public.stock_universe FOR SELECT USING (true);
CREATE POLICY "Anyone can read stock_fundamentals" ON public.stock_fundamentals FOR SELECT USING (true);
CREATE POLICY "Anyone can read hidden_gems_scores" ON public.hidden_gems_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can read hidden_gems_metrics" ON public.hidden_gems_metrics FOR SELECT USING (true);
-- ============================================
-- 1) TABLA DE RATE LIMITING (api_usage)
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api usage"
  ON public.api_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_api_usage_user_endpoint ON public.api_usage(user_id, endpoint, window_start);

-- ============================================
-- 2) TABLAS DE ESCALABILIDAD
-- ============================================

-- Tabla para almacenar velas precalculadas
CREATE TABLE IF NOT EXISTS public.asset_candles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  interval TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(symbol, asset_type, interval, timestamp)
);

CREATE INDEX idx_asset_candles_lookup ON public.asset_candles(symbol, asset_type, interval, timestamp DESC);

-- Tabla para snapshots de indicadores precalculados
CREATE TABLE IF NOT EXISTS public.asset_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  interval TEXT NOT NULL,
  current_price NUMERIC NOT NULL,
  ema_9 NUMERIC,
  ema_21 NUMERIC,
  ema_50 NUMERIC,
  ema_200 NUMERIC,
  rsi NUMERIC,
  macd NUMERIC,
  macd_signal NUMERIC,
  macd_histogram NUMERIC,
  atr NUMERIC,
  supertrend NUMERIC,
  supertrend_direction TEXT,
  signal_type TEXT,
  signal_score NUMERIC,
  confidence NUMERIC,
  trend TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(symbol, asset_type, interval)
);

CREATE INDEX idx_asset_snapshots_lookup ON public.asset_snapshots(symbol, asset_type, interval);
CREATE INDEX idx_asset_snapshots_signal ON public.asset_snapshots(signal_type, confidence DESC);

-- RLS públicas de solo lectura para asset_candles y asset_snapshots
ALTER TABLE public.asset_candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read asset_candles"
  ON public.asset_candles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read asset_snapshots"
  ON public.asset_snapshots FOR SELECT
  USING (true);

-- ============================================
-- 3) FUNCIÓN HELPER PARA SUBSCRIPTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier::text FROM public.user_subscriptions WHERE user_id = p_user_id LIMIT 1),
    'free'
  );
$$;

-- ============================================
-- 4) TRIGGER PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_api_usage_updated_at
  BEFORE UPDATE ON public.api_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
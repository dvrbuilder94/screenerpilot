-- Market alerts feed: regime changes on ratio_snapshots and squeeze-score
-- crossings on the stock universe. Written only by service-role collectors
-- (ratios-collector, squeeze-alert-scan), read by everyone for the in-app
-- notification bell.
CREATE TABLE public.market_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('regime_change', 'squeeze')),
  entity_id TEXT NOT NULL,
  entity_label TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_alerts_created_at ON public.market_alerts(created_at DESC);
CREATE INDEX idx_market_alerts_type ON public.market_alerts(alert_type);

ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market_alerts"
  ON public.market_alerts FOR SELECT USING (true);
CREATE POLICY "Deny public INSERT on market_alerts"
  ON public.market_alerts FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on market_alerts"
  ON public.market_alerts FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on market_alerts"
  ON public.market_alerts FOR DELETE USING (false);

-- Per-ticker memory of the last squeeze score seen, so squeeze-alert-scan
-- can detect a threshold *crossing* instead of re-alerting on every scan
-- while a ticker stays hot.
CREATE TABLE public.squeeze_alert_state (
  ticker TEXT NOT NULL PRIMARY KEY,
  last_score NUMERIC NOT NULL,
  last_alerted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.squeeze_alert_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny public SELECT on squeeze_alert_state"
  ON public.squeeze_alert_state FOR SELECT USING (false);
CREATE POLICY "Deny public INSERT on squeeze_alert_state"
  ON public.squeeze_alert_state FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on squeeze_alert_state"
  ON public.squeeze_alert_state FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on squeeze_alert_state"
  ON public.squeeze_alert_state FOR DELETE USING (false);

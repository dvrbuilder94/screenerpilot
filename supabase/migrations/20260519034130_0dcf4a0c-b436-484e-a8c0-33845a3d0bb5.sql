
-- Deny writes on hidden_gems_scores
CREATE POLICY "Deny public INSERT on hidden_gems_scores" ON public.hidden_gems_scores FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on hidden_gems_scores" ON public.hidden_gems_scores FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on hidden_gems_scores" ON public.hidden_gems_scores FOR DELETE USING (false);

-- Deny writes on hidden_gems_metrics
CREATE POLICY "Deny public INSERT on hidden_gems_metrics" ON public.hidden_gems_metrics FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on hidden_gems_metrics" ON public.hidden_gems_metrics FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on hidden_gems_metrics" ON public.hidden_gems_metrics FOR DELETE USING (false);

-- Deny writes on signal_outcomes
CREATE POLICY "Deny public INSERT on signal_outcomes" ON public.signal_outcomes FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on signal_outcomes" ON public.signal_outcomes FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on signal_outcomes" ON public.signal_outcomes FOR DELETE USING (false);

-- Deny writes on signal_snapshots
CREATE POLICY "Deny public INSERT on signal_snapshots" ON public.signal_snapshots FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on signal_snapshots" ON public.signal_snapshots FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on signal_snapshots" ON public.signal_snapshots FOR DELETE USING (false);

-- Deny writes on stock_universe
CREATE POLICY "Deny public INSERT on stock_universe" ON public.stock_universe FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on stock_universe" ON public.stock_universe FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on stock_universe" ON public.stock_universe FOR DELETE USING (false);

-- Deny writes on stock_fundamentals
CREATE POLICY "Deny public INSERT on stock_fundamentals" ON public.stock_fundamentals FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny public UPDATE on stock_fundamentals" ON public.stock_fundamentals FOR UPDATE USING (false);
CREATE POLICY "Deny public DELETE on stock_fundamentals" ON public.stock_fundamentals FOR DELETE USING (false);

-- Drop user-update policy on user_ai_usage so users cannot reset their counter
DROP POLICY IF EXISTS "Users can update their own AI usage" ON public.user_ai_usage;

-- user_subscriptions already restricts writes to service_role via "Service role manages subscriptions".
-- No user-facing UPDATE policy currently exists, so the finding about an unauthenticated UPDATE
-- policy is no longer present in the schema; nothing to change here.

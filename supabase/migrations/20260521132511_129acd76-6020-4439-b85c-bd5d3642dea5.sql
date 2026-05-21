-- Remove user-facing INSERT policy on user_ai_usage; only service role should write
DROP POLICY IF EXISTS "Users can insert their own AI usage" ON public.user_ai_usage;

-- Ensure service role can manage all rows for rate-limit tracking
DROP POLICY IF EXISTS "Service role manages ai usage" ON public.user_ai_usage;
CREATE POLICY "Service role manages ai usage"
ON public.user_ai_usage
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
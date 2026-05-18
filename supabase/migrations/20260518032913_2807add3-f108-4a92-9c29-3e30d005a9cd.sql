-- Prevent users from escalating their own subscription tier
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;

-- Only service role (via trigger handle_new_user / backend) can modify subscriptions.
-- handle_new_user runs as SECURITY DEFINER so bypasses RLS; webhook updates use service role.
CREATE POLICY "Service role manages subscriptions"
ON public.user_subscriptions
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
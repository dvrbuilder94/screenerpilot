-- Add INSERT policy for user_subscriptions table
CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
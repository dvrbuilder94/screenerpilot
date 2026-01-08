-- Add INSERT policy for api_usage - admin only
CREATE POLICY "Only admins can insert api_usage"
  ON public.api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add UPDATE policy for api_usage - admin only  
CREATE POLICY "Only admins can update api_usage"
  ON public.api_usage
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policy for api_usage - admin only
CREATE POLICY "Only admins can delete api_usage"
  ON public.api_usage
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
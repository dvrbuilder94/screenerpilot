-- Fix function search path for calculate_level
CREATE OR REPLACE FUNCTION public.calculate_level(points INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT FLOOR(SQRT(points / 100.0))::INTEGER + 1;
$$;
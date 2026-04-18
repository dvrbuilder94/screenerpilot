-- Drop dependent functions first
DROP FUNCTION IF EXISTS public.record_prediction_vote(uuid, boolean);
DROP FUNCTION IF EXISTS public.resolve_prediction(uuid, boolean);
DROP FUNCTION IF EXISTS public.calculate_level(integer);

-- Drop zombie tables (cascade to remove FKs)
DROP TABLE IF EXISTS public.prediction_votes CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.user_season_stats CASCADE;
DROP TABLE IF EXISTS public.seasons CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_gamification CASCADE;
DROP TABLE IF EXISTS public.sentiment_votes CASCADE;
DROP TABLE IF EXISTS public.price_expectations CASCADE;

-- Recreate handle_new_user without references to dropped tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.user_subscriptions (user_id, tier, max_tickers)
  VALUES (NEW.id, 'free', 10);

  RETURN NEW;
END;
$function$;
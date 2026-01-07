-- Create app_role enum if not exists (for admin check)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for admin access
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Seasons table
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons"
ON public.seasons
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage seasons"
ON public.seasons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Predictions table
CREATE TABLE public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  symbol text NOT NULL,
  condition jsonb NOT NULL,
  resolve_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  result boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view predictions"
ON public.predictions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage predictions"
ON public.predictions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Prediction votes table
CREATE TABLE public.prediction_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  choice boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prediction_id, user_id)
);

ALTER TABLE public.prediction_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
ON public.prediction_votes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.prediction_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User season stats table
CREATE TABLE public.user_season_stats (
  user_id uuid NOT NULL,
  season_id uuid REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season_id)
);

ALTER TABLE public.user_season_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view season stats"
ON public.user_season_stats
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own stats"
ON public.user_season_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.user_season_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to record a vote and update XP
CREATE OR REPLACE FUNCTION public.record_prediction_vote(
  p_prediction_id uuid,
  p_choice boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get season_id from prediction
  SELECT season_id INTO v_season_id
  FROM public.predictions
  WHERE id = p_prediction_id AND status = 'open';
  
  IF v_season_id IS NULL THEN
    RAISE EXCEPTION 'Prediction not found or already resolved';
  END IF;
  
  -- Insert vote
  INSERT INTO public.prediction_votes (prediction_id, user_id, choice)
  VALUES (p_prediction_id, v_user_id, p_choice);
  
  -- Update or insert user stats (+5 XP for voting)
  INSERT INTO public.user_season_stats (user_id, season_id, xp, total)
  VALUES (v_user_id, v_season_id, 5, 1)
  ON CONFLICT (user_id, season_id) 
  DO UPDATE SET 
    xp = user_season_stats.xp + 5,
    total = user_season_stats.total + 1,
    updated_at = now();
END;
$$;

-- Function to resolve a prediction (admin only)
CREATE OR REPLACE FUNCTION public.resolve_prediction(
  p_prediction_id uuid,
  p_result boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
BEGIN
  -- Check admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Get season_id and update prediction
  UPDATE public.predictions
  SET status = 'resolved', result = p_result
  WHERE id = p_prediction_id AND status = 'open'
  RETURNING season_id INTO v_season_id;
  
  IF v_season_id IS NULL THEN
    RAISE EXCEPTION 'Prediction not found or already resolved';
  END IF;
  
  -- Award +20 XP to users who predicted correctly
  UPDATE public.user_season_stats uss
  SET 
    xp = uss.xp + 20,
    correct = uss.correct + 1,
    updated_at = now()
  FROM public.prediction_votes pv
  WHERE pv.prediction_id = p_prediction_id
    AND pv.choice = p_result
    AND pv.user_id = uss.user_id
    AND uss.season_id = v_season_id;
END;
$$;
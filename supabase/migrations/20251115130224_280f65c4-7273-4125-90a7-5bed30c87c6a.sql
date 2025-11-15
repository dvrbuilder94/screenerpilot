-- Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create user_ai_usage table for server-side rate limiting
CREATE TABLE public.user_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on user_ai_usage
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_ai_usage
CREATE POLICY "Users can view their own AI usage"
ON public.user_ai_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage"
ON public.user_ai_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage"
ON public.user_ai_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_ai_usage_user_date ON public.user_ai_usage(user_id, date);

-- Add trigger for updated_at on user_ai_usage
CREATE TRIGGER update_user_ai_usage_updated_at
BEFORE UPDATE ON public.user_ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
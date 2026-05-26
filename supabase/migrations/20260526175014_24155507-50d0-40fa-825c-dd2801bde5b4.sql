
CREATE TABLE public.committee_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  response JSONB NOT NULL,
  market_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.committee_queries TO authenticated;
GRANT ALL ON public.committee_queries TO service_role;

ALTER TABLE public.committee_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own committee queries"
ON public.committee_queries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create own committee queries"
ON public.committee_queries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own committee queries"
ON public.committee_queries FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages committee queries"
ON public.committee_queries FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_committee_queries_user_created
ON public.committee_queries(user_id, created_at DESC);

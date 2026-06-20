-- Per-user opt-in for the daily market digest email.
-- Defaults to true so existing signed-up users start receiving it;
-- they can turn it off independently of the global unsubscribe list,
-- which also suppresses transactional mail (password resets, receipts, etc).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_digest_enabled BOOLEAN NOT NULL DEFAULT true;

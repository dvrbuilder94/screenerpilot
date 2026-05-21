REVOKE EXECUTE ON FUNCTION public.get_user_tier(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM authenticated;
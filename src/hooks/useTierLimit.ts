import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { BILLING_ENABLED } from "@/lib/billing";

const ANON_LIMIT = 5;

export type Tier = "anon" | "free" | "paid";

export function useTierLimit() {
  const { user } = useAuth();
  const { isActive } = useSubscription();

  const { data: freeRow, isLoading } = useQuery({
    queryKey: ["tier-limit", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("max_tickers")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isActive,
    staleTime: 60_000,
  });

  // Billing hidden → full access for everyone (paywall disabled while on $SCRP).
  if (!BILLING_ENABLED || isActive) {
    return { tier: "paid" as Tier, limit: Infinity, isPaid: true, isLoading: false };
  }
  if (user) {
    return { tier: "free" as Tier, limit: freeRow?.max_tickers ?? 10, isPaid: false, isLoading };
  }
  return { tier: "anon" as Tier, limit: ANON_LIMIT, isPaid: false, isLoading: false };
}

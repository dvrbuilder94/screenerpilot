import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

export function useSubscription() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id, getPaddleEnvironment()],
    queryFn: async () => {
      if (!user) return null;
      // @ts-ignore - subscriptions table is new and not yet in generated types
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", getPaddleEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const sub = query.data;
  const now = Date.now();
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;

  const isActive = !!sub && (
    (["active", "trialing", "past_due"].includes(sub.status) && (!periodEnd || periodEnd > now))
    || (sub.status === "canceled" && periodEnd && periodEnd > now)
  );

  const isTrialing = sub?.status === "trialing";
  const isPastDue = sub?.status === "past_due";

  return { ...query, subscription: sub, isActive, isTrialing, isPastDue };
}

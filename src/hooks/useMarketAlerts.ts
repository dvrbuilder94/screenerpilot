import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketAlert {
  id: string;
  alert_type: "regime_change" | "squeeze";
  entity_id: string;
  entity_label: string;
  title: string;
  message: string;
  severity: "info" | "warning";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useMarketAlerts(limit = 20) {
  return useQuery({
    queryKey: ["market_alerts", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("market_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as MarketAlert[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

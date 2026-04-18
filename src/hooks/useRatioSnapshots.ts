import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RatioSnapshot {
  id: string;
  ratio_id: string;
  display_name: string;
  category: string;
  numerator_symbol: string;
  denominator_symbol: string;
  current_value: number | null;
  mean_5y: number | null;
  std_5y: number | null;
  min_5y: number | null;
  max_5y: number | null;
  percentile_5y: number | null;
  z_score: number | null;
  change_pct_1d: number | null;
  change_pct_1w: number | null;
  change_pct_1m: number | null;
  change_pct_3m: number | null;
  history_90d: { date: string; value: number }[] | null;
  notes: string | null;
  fetched_at: string;
}

export function useRatioSnapshots(category?: string) {
  return useQuery({
    queryKey: ["ratio_snapshots", category ?? "all"],
    queryFn: async () => {
      let query = supabase.from("ratio_snapshots").select("*").order("ratio_id");
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as RatioSnapshot[];
    },
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MacroIndicator {
  id: string;
  series_id: string;
  display_name: string;
  category: string;
  country: string | null;
  current_value: number | null;
  previous_value: number | null;
  change_value: number | null;
  change_pct: number | null;
  observation_date: string | null;
  frequency: string | null;
  unit: string | null;
  history: { date: string; value: number }[] | null;
  notes: string | null;
  fetched_at: string;
}

export function useMacroIndicators(category?: string, country?: string) {
  return useQuery({
    queryKey: ["macro_indicators", category ?? "all", country ?? "all"],
    queryFn: async () => {
      let query = supabase.from("macro_indicators").select("*");
      if (category) query = query.eq("category", category);
      if (country) query = query.eq("country", country);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MacroIndicator[];
    },
    refetchInterval: 5 * 60_000, // 5min (FRED data updates daily/monthly)
    staleTime: 60_000,
  });
}

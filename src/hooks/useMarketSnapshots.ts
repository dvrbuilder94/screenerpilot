import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketSnapshot {
  id: string;
  symbol: string;
  category: string;
  display_name: string;
  region: string | null;
  current_price: number | null;
  previous_close: number | null;
  change_1d: number | null;
  change_pct_1d: number | null;
  change_pct_1w: number | null;
  change_pct_1m: number | null;
  change_pct_ytd: number | null;
  change_pct_1y: number | null;
  volume: number | null;
  market_cap: number | null;
  fetched_at: string;
}

export function useMarketSnapshots(category?: string) {
  return useQuery({
    queryKey: ["market_snapshots", category ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("market_snapshots")
        .select("*")
        .order("symbol", { ascending: true });

      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MarketSnapshot[];
    },
    refetchInterval: 60_000, // refresh every minute (data updates every 15min in DB)
    staleTime: 30_000,
  });
}

export function useMarketSnapshotsBySymbols(symbols: string[]) {
  return useQuery({
    queryKey: ["market_snapshots_symbols", symbols.sort().join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return [];
      const { data, error } = await supabase
        .from("market_snapshots")
        .select("*")
        .in("symbol", symbols);
      if (error) throw error;
      return (data ?? []) as MarketSnapshot[];
    },
    enabled: symbols.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Quote {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  currency: string;
}

// Live quotes for ANY tickers via the `quotes` edge function (Yahoo-backed),
// so the watchlist isn't limited to the collected snapshot universe.
export function useQuotes(symbols: string[]) {
  const key = [...symbols].map((s) => s.toUpperCase()).sort().join(",");
  return useQuery({
    queryKey: ["quotes", key],
    queryFn: async () => {
      if (symbols.length === 0) return {} as Record<string, Quote>;
      const { data, error } = await supabase.functions.invoke("quotes", { body: { symbols } });
      if (error) throw error;
      const map: Record<string, Quote> = {};
      for (const q of (data?.quotes ?? []) as Quote[]) map[q.symbol] = q;
      return map;
    },
    enabled: symbols.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

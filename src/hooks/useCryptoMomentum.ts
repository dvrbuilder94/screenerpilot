import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CryptoRegime = "overbought" | "oversold" | "bullish" | "bearish" | "neutral" | "unknown";

export interface TrackedCryptoMetric {
  id: string;
  symbol: string;
  name: string;
  group: "core" | "defi" | "high-beta";
  price: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  change_1h: number | null;
  change_24h: number | null;
  change_7d: number | null;
  change_30d: number | null;
  rsi_14: number | null;
  ema_20: number | null;
  ema_50: number | null;
  distance_ema20_pct: number | null;
  volatility_30d_ann: number | null;
  momentum_score: number | null;
  regime: CryptoRegime;
  data_points: number;
  error: string | null;
}

interface CryptoMomentumResponse {
  tracked: TrackedCryptoMetric[];
  fetched_at: string;
  cached: boolean;
}

export function useCryptoMomentum() {
  return useQuery({
    queryKey: ["crypto-momentum-tracked"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<CryptoMomentumResponse>("crypto-momentum");
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

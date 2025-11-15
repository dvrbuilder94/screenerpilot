import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssetSnapshot {
  id: string;
  symbol: string;
  asset_type: string;
  interval: string;
  current_price: number;
  ema_9: number | null;
  ema_21: number | null;
  ema_50: number | null;
  ema_200: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  atr: number | null;
  supertrend: number | null;
  supertrend_direction: string | null;
  signal_type: string | null;
  signal_score: number | null;
  confidence: number | null;
  trend: string | null;
  calculated_at: string;
}

export function useAssetSnapshot(
  symbol: string,
  assetType: string,
  interval: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['asset-snapshot', symbol, assetType, interval],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_snapshots')
        .select('*')
        .eq('symbol', symbol)
        .eq('asset_type', assetType)
        .eq('interval', interval)
        .maybeSingle();

      if (error) throw error;
      return data as AssetSnapshot | null;
    },
    enabled,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useTopSignals(
  assetType: string = 'crypto',
  limit: number = 20
) {
  return useQuery({
    queryKey: ['top-signals', assetType, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_snapshots')
        .select('*')
        .eq('asset_type', assetType)
        .order('confidence', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AssetSnapshot[];
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useAssetCandles(
  symbol: string,
  assetType: string,
  interval: string,
  limit: number = 100,
  enabled = true
) {
  return useQuery({
    queryKey: ['asset-candles', symbol, assetType, interval, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_candles')
        .select('*')
        .eq('symbol', symbol)
        .eq('asset_type', assetType)
        .eq('interval', interval)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Reverse to get chronological order
      return (data || []).reverse();
    },
    enabled,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

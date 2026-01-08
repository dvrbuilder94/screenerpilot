import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SignalSnapshot {
  id: string;
  symbol: string;
  asset_type: string;
  timeframe: string;
  signal: string;
  score: number;
  confidence: number;
  price_at_signal: number;
  created_at: string;
}

export interface SignalOutcome {
  id: string;
  snapshot_id: string;
  horizon: string;
  start_price: number;
  end_price: number;
  return_pct: number;
  max_drawdown: number;
  resolved_at: string;
}

export interface TrackRecordMetrics {
  signal: string;
  timeframe: string;
  horizon: string;
  sample_size: number;
  avg_return: number;
  avg_drawdown: number;
  win_rate: number;
  total_wins: number;
}

// Fetch recent signal snapshots (DAILY ONLY for track record)
export function useSignalSnapshots(
  symbol?: string,
  limit = 50
) {
  return useQuery({
    queryKey: ['signal-snapshots', symbol, '1d', limit],
    queryFn: async () => {
      let query = supabase
        .from('signal_snapshots')
        .select('*')
        .eq('timeframe', '1d') // Daily signals only for track record
        .order('created_at', { ascending: false })
        .limit(limit);

      if (symbol) query = query.eq('symbol', symbol);

      const { data, error } = await query;
      if (error) throw error;
      return data as SignalSnapshot[];
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Fetch recent resolved outcomes
export function useRecentOutcomes(limit = 50) {
  return useQuery({
    queryKey: ['recent-outcomes', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signal_outcomes')
        .select(`
          *,
          signal_snapshots (
            symbol,
            asset_type,
            timeframe,
            signal,
            score,
            confidence
          )
        `)
        .order('resolved_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as (SignalOutcome & { signal_snapshots: Partial<SignalSnapshot> })[];
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Fetch aggregated track record metrics
export function useTrackRecordMetrics(
  horizon: '1w' | '1m' | '3m' = '1w',
  timeframe?: string
) {
  return useQuery({
    queryKey: ['track-record-metrics', horizon, timeframe],
    queryFn: async () => {
      // Fetch all resolved outcomes for this horizon
      let query = supabase
        .from('signal_outcomes')
        .select(`
          return_pct,
          max_drawdown,
          signal_snapshots!inner (
            signal,
            timeframe
          )
        `)
        .eq('horizon', horizon);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Group and aggregate in memory
      const grouped = new Map<string, {
        returns: number[];
        drawdowns: number[];
        wins: number;
      }>();

      for (const row of data) {
        const snapshot = row.signal_snapshots as any;
        if (!snapshot) continue;
        
        // Filter by timeframe if specified
        if (timeframe && snapshot.timeframe !== timeframe) continue;

        const key = `${snapshot.signal}|${snapshot.timeframe}`;
        
        if (!grouped.has(key)) {
          grouped.set(key, { returns: [], drawdowns: [], wins: 0 });
        }

        const group = grouped.get(key)!;
        group.returns.push(Number(row.return_pct));
        group.drawdowns.push(Number(row.max_drawdown));
        
        // Win logic: positive return for BUY signals, negative for SELL signals
        const isLongSignal = ['STRONG_BUY', 'BUY'].includes(snapshot.signal);
        const isWin = isLongSignal 
          ? row.return_pct > 0 
          : row.return_pct < 0;
        if (isWin) group.wins++;
      }

      // Calculate metrics
      const metrics: TrackRecordMetrics[] = [];
      
      for (const [key, group] of grouped) {
        const [signal, tf] = key.split('|');
        const sampleSize = group.returns.length;
        
        if (sampleSize === 0) continue;

        const avgReturn = group.returns.reduce((a, b) => a + b, 0) / sampleSize;
        const avgDrawdown = group.drawdowns.reduce((a, b) => a + b, 0) / sampleSize;
        const winRate = (group.wins / sampleSize) * 100;

        metrics.push({
          signal,
          timeframe: tf,
          horizon,
          sample_size: sampleSize,
          avg_return: avgReturn,
          avg_drawdown: avgDrawdown,
          win_rate: winRate,
          total_wins: group.wins,
        });
      }

      // Sort by sample size descending
      return metrics.sort((a, b) => b.sample_size - a.sample_size);
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// Get total track record stats (DAILY ONLY)
export function useTrackRecordStats() {
  return useQuery({
    queryKey: ['track-record-stats'],
    queryFn: async () => {
      const [snapshotsResult, outcomesResult] = await Promise.all([
        supabase.from('signal_snapshots')
          .select('id', { count: 'exact', head: true })
          .eq('timeframe', '1d'), // Daily signals only for track record
        supabase.from('signal_outcomes').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalSnapshots: snapshotsResult.count || 0,
        totalOutcomes: outcomesResult.count || 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

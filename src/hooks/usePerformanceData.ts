import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquityPoint {
  date: string;
  equity: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  winRate: number;
  tradeCount: number;
  startDate: string | null;
}

export interface TradeRecord {
  id: string;
  asset: string;
  signal: string;
  entryDate: string;
  exitDate: string;
  returnPct: number;
}

// Demo data for when real data is insufficient
function generateDemoData(): { equityCurve: EquityPoint[]; metrics: PerformanceMetrics; trades: TradeRecord[] } {
  const startDate = new Date("2024-06-01");
  const equityCurve: EquityPoint[] = [];
  let equity = 100;

  // Generate realistic-looking equity curve
  for (let i = 0; i < 180; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Add some randomness with slight upward bias
    const dailyReturn = (Math.random() - 0.45) * 2;
    equity = equity * (1 + dailyReturn / 100);
    equity = Math.max(equity, 85); // Floor to prevent unrealistic drops
    
    equityCurve.push({
      date: date.toISOString().split("T")[0],
      equity: Math.round(equity * 100) / 100,
    });
  }

  const finalEquity = equityCurve[equityCurve.length - 1].equity;
  const totalReturn = ((finalEquity - 100) / 100) * 100;

  return {
    equityCurve,
    metrics: {
      totalReturn: Math.round(totalReturn * 100) / 100,
      cagr: Math.round(totalReturn * 2 * 100) / 100, // Annualized approximation
      maxDrawdown: -8.5,
      winRate: 62.3,
      tradeCount: 47,
      startDate: "2024-06-01",
    },
    trades: [
      { id: "1", asset: "BTCUSDT", signal: "BUY", entryDate: "2024-11-28", exitDate: "2024-12-05", returnPct: 4.2 },
      { id: "2", asset: "ETHUSDT", signal: "BUY", entryDate: "2024-11-25", exitDate: "2024-12-02", returnPct: 2.8 },
      { id: "3", asset: "AAPL", signal: "BUY", entryDate: "2024-11-20", exitDate: "2024-11-27", returnPct: -1.5 },
      { id: "4", asset: "SPY", signal: "BUY", entryDate: "2024-11-15", exitDate: "2024-11-22", returnPct: 1.9 },
      { id: "5", asset: "SOLUSDT", signal: "BUY", entryDate: "2024-11-10", exitDate: "2024-11-17", returnPct: 8.3 },
    ],
  };
}

export function usePerformanceData(timeRange: "all" | "6m" | "3m" = "all") {
  return useQuery({
    queryKey: ["performance-data", timeRange],
    queryFn: async () => {
      // Fetch all signal outcomes with their snapshots
      const { data: outcomes, error } = await supabase
        .from("signal_outcomes")
        .select(`
          id,
          return_pct,
          max_drawdown,
          resolved_at,
          start_price,
          end_price,
          horizon,
          signal_snapshots (
            symbol,
            signal,
            created_at
          )
        `)
        .order("resolved_at", { ascending: true });

      if (error) throw error;

      // If insufficient data, return demo data
      if (!outcomes || outcomes.length < 10) {
        const demo = generateDemoData();
        return { ...demo, isDemo: true };
      }

      // Calculate time range filter
      let filteredOutcomes = outcomes;
      if (timeRange !== "all") {
        const now = new Date();
        const months = timeRange === "6m" ? 6 : 3;
        const cutoff = new Date(now.setMonth(now.getMonth() - months));
        filteredOutcomes = outcomes.filter(
          (o) => new Date(o.resolved_at) >= cutoff
        );
      }

      // Build equity curve
      let equity = 100;
      let maxEquity = 100;
      let maxDrawdown = 0;
      let wins = 0;

      const equityCurve: EquityPoint[] = [];

      for (const outcome of filteredOutcomes) {
        const returnPct = Number(outcome.return_pct);
        equity = equity * (1 + returnPct / 100);

        if (equity > maxEquity) maxEquity = equity;
        const drawdown = ((equity - maxEquity) / maxEquity) * 100;
        if (drawdown < maxDrawdown) maxDrawdown = drawdown;

        if (returnPct > 0) wins++;

        equityCurve.push({
          date: outcome.resolved_at.split("T")[0],
          equity: Math.round(equity * 100) / 100,
        });
      }

      // Calculate metrics
      const totalReturn = ((equity - 100) / 100) * 100;
      const startDate = outcomes[0]?.signal_snapshots?.created_at?.split("T")[0] || null;
      const endDate = outcomes[outcomes.length - 1]?.resolved_at;

      // Calculate CAGR
      let cagr = 0;
      if (startDate && endDate) {
        const years =
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000);
        if (years > 0) {
          cagr = (Math.pow(equity / 100, 1 / years) - 1) * 100;
        }
      }

      // Get last 20 trades for history
      const trades: TradeRecord[] = outcomes.slice(-20).reverse().map((o) => ({
        id: o.id,
        asset: (o.signal_snapshots as any)?.symbol || "Unknown",
        signal: (o.signal_snapshots as any)?.signal || "UNKNOWN",
        entryDate: (o.signal_snapshots as any)?.created_at?.split("T")[0] || "",
        exitDate: o.resolved_at.split("T")[0],
        returnPct: Math.round(Number(o.return_pct) * 100) / 100,
      }));

      return {
        equityCurve,
        metrics: {
          totalReturn: Math.round(totalReturn * 100) / 100,
          cagr: Math.round(cagr * 100) / 100,
          maxDrawdown: Math.round(maxDrawdown * 100) / 100,
          winRate: Math.round((wins / filteredOutcomes.length) * 10000) / 100,
          tradeCount: filteredOutcomes.length,
          startDate,
        },
        trades,
        isDemo: false,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

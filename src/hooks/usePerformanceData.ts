import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquityPoint {
  date: string;
  equity: number;
  benchmark?: number;
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

/**
 * Deterministic random number generator based on string seed.
 * Same seed always produces same output.
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

/**
 * Fetch real S&P 500 data from Yahoo Finance via edge function
 */
async function fetchSP500Data(): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
      body: { symbol: "^GSPC", interval: "1d" },
    });

    if (error || !data || !Array.isArray(data)) {
      console.warn("Failed to fetch S&P 500 data, using fallback");
      return new Map();
    }

    const priceMap = new Map<string, number>();
    
    // Normalize to 100 at first data point
    const firstClose = data[0]?.close || 1;
    
    for (const candle of data) {
      const date = new Date(candle.openTime).toISOString().split("T")[0];
      const normalizedPrice = (candle.close / firstClose) * 100;
      priceMap.set(date, Math.round(normalizedPrice * 100) / 100);
    }

    return priceMap;
  } catch (err) {
    console.warn("Error fetching S&P 500:", err);
    return new Map();
  }
}

/**
 * Generate deterministic demo data.
 * Same date = same equity value, always.
 */
function generateDemoData(
  sp500Data: Map<string, number>
): { 
  fullEquityCurve: EquityPoint[]; 
  metrics: PerformanceMetrics; 
  trades: TradeRecord[];
  isDemo: boolean;
} {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 8); // 8 months of data
  
  const fullEquityCurve: EquityPoint[] = [];
  let equity = 100;
  let maxEquity = 100;
  let maxDrawdown = 0;
  let wins = 0;
  const totalTrades = 47;

  // Get first S&P value for normalization
  const sp500Entries = Array.from(sp500Data.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Generate daily equity points
  const currentDate = new Date(startDate);
  let dayIndex = 0;
  
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split("T")[0];
    
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Deterministic daily return based on date
      const dailyRandom = seededRandom(dateStr + 'equity');
      const dailyReturn = (dailyRandom - 0.45) * 1.8;
      equity = equity * (1 + dailyReturn / 100);
      
      // Deterministic win/loss
      if (seededRandom(dateStr + 'win') > 0.5) wins++;
      
      if (equity > maxEquity) maxEquity = equity;
      const drawdown = ((equity - maxEquity) / maxEquity) * 100;
      if (drawdown < maxDrawdown) maxDrawdown = drawdown;
      
      // Get real S&P 500 benchmark value or simulate
      let benchmarkValue = sp500Data.get(dateStr);
      if (!benchmarkValue && sp500Entries.length > 0) {
        // Find closest date
        const closest = sp500Entries.reduce((prev, curr) => {
          return Math.abs(new Date(curr[0]).getTime() - currentDate.getTime()) < 
                 Math.abs(new Date(prev[0]).getTime() - currentDate.getTime()) ? curr : prev;
        });
        benchmarkValue = closest[1];
      }
      
      fullEquityCurve.push({
        date: dateStr,
        equity: Math.round(equity * 100) / 100,
        benchmark: benchmarkValue || Math.round((100 + dayIndex * 0.05) * 100) / 100,
      });
      
      dayIndex++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const finalEquity = fullEquityCurve[fullEquityCurve.length - 1]?.equity || 100;
  const totalReturn = ((finalEquity - 100) / 100) * 100;
  const years = fullEquityCurve.length / 252; // ~252 trading days per year
  const cagr = years > 0 ? (Math.pow(finalEquity / 100, 1 / years) - 1) * 100 : 0;

  // Generate deterministic demo trades
  const trades: TradeRecord[] = [];
  const symbols = ["BTCUSDT", "ETHUSDT", "AAPL", "SPY", "SOLUSDT", "GOOGL", "MSFT", "NVDA"];
  for (let i = 0; i < 5; i++) {
    const exitDate = new Date(today);
    exitDate.setDate(exitDate.getDate() - i * 7);
    const entryDate = new Date(exitDate);
    entryDate.setDate(entryDate.getDate() - 5);
    
    // Deterministic return based on trade index
    const tradeRandom = seededRandom(`trade-${i}`);
    const tradeReturn = Math.round((tradeRandom * 10 - 2) * 10) / 10;
    
    trades.push({
      id: String(i + 1),
      asset: symbols[i % symbols.length],
      signal: "BUY",
      entryDate: entryDate.toISOString().split("T")[0],
      exitDate: exitDate.toISOString().split("T")[0],
      returnPct: tradeReturn,
    });
  }

  return {
    fullEquityCurve,
    metrics: {
      totalReturn: Math.round(totalReturn * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      winRate: Math.round((wins / totalTrades) * 10000) / 100,
      tradeCount: totalTrades,
      startDate: startDate.toISOString().split("T")[0],
    },
    trades,
    isDemo: true,
  };
}

/**
 * Filter equity curve for chart display only.
 * Metrics are ALWAYS calculated from inception.
 */
export function filterEquityCurveForView(
  fullCurve: EquityPoint[],
  timeRange: "all" | "6m" | "3m"
): EquityPoint[] {
  if (timeRange === "all" || fullCurve.length === 0) {
    return fullCurve;
  }

  const now = new Date();
  const months = timeRange === "6m" ? 6 : 3;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);

  const filtered = fullCurve.filter((point) => new Date(point.date) >= cutoff);
  
  // Always return at least some data
  return filtered.length > 0 ? filtered : fullCurve.slice(-30);
}

export function usePerformanceData() {
  return useQuery({
    queryKey: ["performance-data"],
    queryFn: async () => {
      // Fetch S&P 500 benchmark data first
      const sp500Data = await fetchSP500Data();
      
      // Fetch ALL signal outcomes with their snapshots (inception-based)
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

      // If insufficient data, return demo data with real S&P 500
      if (!outcomes || outcomes.length < 10) {
        return generateDemoData(sp500Data);
      }

      // Build FULL equity curve from inception (single source of truth)
      let equity = 100;
      let maxEquity = 100;
      let maxDrawdown = 0;
      let wins = 0;

      const fullEquityCurve: EquityPoint[] = [];
      const inceptionDate = outcomes[0]?.signal_snapshots?.created_at?.split("T")[0] || outcomes[0]?.resolved_at.split("T")[0];

      // Normalize S&P 500 to 100 at inception
      const inceptionSP500 = sp500Data.get(inceptionDate) || 100;

      for (const outcome of outcomes) {
        const returnPct = Number(outcome.return_pct);
        equity = equity * (1 + returnPct / 100);

        if (equity > maxEquity) maxEquity = equity;
        const drawdown = ((equity - maxEquity) / maxEquity) * 100;
        if (drawdown < maxDrawdown) maxDrawdown = drawdown;

        if (returnPct > 0) wins++;

        const dateStr = outcome.resolved_at.split("T")[0];
        
        // Get real S&P 500 value, normalized to inception
        let benchmarkValue = sp500Data.get(dateStr);
        if (benchmarkValue) {
          benchmarkValue = (benchmarkValue / inceptionSP500) * 100;
        }

        fullEquityCurve.push({
          date: dateStr,
          equity: Math.round(equity * 100) / 100,
          benchmark: benchmarkValue ? Math.round(benchmarkValue * 100) / 100 : undefined,
        });
      }

      // Calculate metrics from INCEPTION (never changes with time range)
      const latestDate = outcomes[outcomes.length - 1]?.resolved_at;
      const totalReturn = ((equity - 100) / 100) * 100;

      // Calculate CAGR from inception
      let cagr = 0;
      if (inceptionDate && latestDate) {
        const years =
          (new Date(latestDate).getTime() - new Date(inceptionDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000);
        if (years > 0) {
          cagr = (Math.pow(equity / 100, 1 / years) - 1) * 100;
        }
      }

      // Get last 20 trades for history (not affected by time range)
      const trades: TradeRecord[] = outcomes.slice(-20).reverse().map((o) => ({
        id: o.id,
        asset: (o.signal_snapshots as any)?.symbol || "Unknown",
        signal: (o.signal_snapshots as any)?.signal || "UNKNOWN",
        entryDate: (o.signal_snapshots as any)?.created_at?.split("T")[0] || "",
        exitDate: o.resolved_at.split("T")[0],
        returnPct: Math.round(Number(o.return_pct) * 100) / 100,
      }));

      return {
        fullEquityCurve,
        metrics: {
          totalReturn: Math.round(totalReturn * 100) / 100,
          cagr: Math.round(cagr * 100) / 100,
          maxDrawdown: Math.round(maxDrawdown * 100) / 100,
          winRate: Math.round((wins / outcomes.length) * 10000) / 100,
          tradeCount: outcomes.length,
          startDate: inceptionDate,
        },
        trades,
        isDemo: false,
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

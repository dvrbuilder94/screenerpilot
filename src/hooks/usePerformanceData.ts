import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* =======================
   TYPES
======================= */

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

/* =======================
   BENCHMARK (S&P 500)
======================= */

async function fetchSP500Data(): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-stock-data", {
      body: { symbol: "^GSPC", interval: "1d" },
    });

    if (error || !Array.isArray(data)) return new Map();

    const map = new Map<string, number>();
    const first = data[0]?.close ?? 1;

    for (const candle of data) {
      const date = new Date(candle.openTime).toISOString().split("T")[0];
      const normalized = (candle.close / first) * 100;
      map.set(date, Math.round(normalized * 100) / 100);
    }

    return map;
  } catch {
    return new Map();
  }
}

/* =======================
   DEMO (DETERMINISTIC)
======================= */

function generateDemoData(sp500Data: Map<string, number>): {
  fullEquityCurve: EquityPoint[];
  metrics: PerformanceMetrics;
  trades: TradeRecord[];
  isDemo: boolean;
} {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 8);

  const fullEquityCurve: EquityPoint[] = [];
  let equity = 100;
  let maxEquity = 100;
  let maxDrawdown = 0;
  let wins = 0;

  const spEntries = Array.from(sp500Data.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const firstSP = spEntries[0]?.[1] ?? 100;

  const current = new Date(startDate);
  let i = 0;

  while (current <= today) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      // 🔒 deterministic return
      const trend = 0.045; // ~11% annual
      const cycle = Math.sin(i / 14) * 0.35;
      const dailyReturn = trend + cycle;

      equity *= 1 + dailyReturn / 100;
      if (dailyReturn > 0) wins++;

      if (equity > maxEquity) maxEquity = equity;
      const dd = ((equity - maxEquity) / maxEquity) * 100;
      if (dd < maxDrawdown) maxDrawdown = dd;

      const dateStr = current.toISOString().split("T")[0];
      const sp = sp500Data.get(dateStr);

      fullEquityCurve.push({
        date: dateStr,
        equity: Math.round(equity * 100) / 100,
        benchmark: sp ? Math.round((sp / firstSP) * 10000) / 100 : undefined,
      });

      i++;
    }
    current.setDate(current.getDate() + 1);
  }

  const finalEquity = fullEquityCurve[fullEquityCurve.length - 1]?.equity ?? 100;
  const totalReturn = ((finalEquity - 100) / 100) * 100;
  const years = fullEquityCurve.length / 252;
  const cagr = years > 0 ? (Math.pow(finalEquity / 100, 1 / years) - 1) * 100 : 0;

  const trades: TradeRecord[] = [
    { id: "1", asset: "BTCUSDT", signal: "BUY", entryDate: "2024-06-01", exitDate: "2024-06-07", returnPct: 4.2 },
    { id: "2", asset: "ETHUSDT", signal: "BUY", entryDate: "2024-06-10", exitDate: "2024-06-15", returnPct: -1.3 },
    { id: "3", asset: "AAPL", signal: "BUY", entryDate: "2024-06-18", exitDate: "2024-06-24", returnPct: 2.8 },
    { id: "4", asset: "NVDA", signal: "BUY", entryDate: "2024-07-01", exitDate: "2024-07-05", returnPct: 5.6 },
    { id: "5", asset: "SOLUSDT", signal: "BUY", entryDate: "2024-07-10", exitDate: "2024-07-16", returnPct: 3.1 },
  ];

  return {
    fullEquityCurve,
    metrics: {
      totalReturn: Math.round(totalReturn * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      winRate: Math.round((wins / fullEquityCurve.length) * 10000) / 100,
      tradeCount: 47,
      startDate: startDate.toISOString().split("T")[0],
    },
    trades,
    isDemo: true,
  };
}

/* =======================
   FILTER (VIEW ONLY)
======================= */

export function filterEquityCurveForView(curve: EquityPoint[], timeRange: "all" | "6m" | "3m"): EquityPoint[] {
  if (timeRange === "all") return curve;

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - (timeRange === "6m" ? 6 : 3));

  const filtered = curve.filter((p) => new Date(p.date) >= cutoff);

  return filtered.length ? filtered : curve.slice(-30);
}

/* =======================
   HOOK
======================= */

export function usePerformanceData(timeRange: "all" | "6m" | "3m" = "all") {
  return useQuery({
    queryKey: ["performance-data"], // 🔑 FIX
    queryFn: async () => {
      const sp500Data = await fetchSP500Data();

      const { data: outcomes } = await supabase
        .from("signal_outcomes")
        .select("*")
        .order("resolved_at", { ascending: true });

      if (!outcomes || outcomes.length < 10) {
        return generateDemoData(sp500Data);
      }

      // (cuando haya paper trading real, aquí entra tu lógica real)
      return generateDemoData(sp500Data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

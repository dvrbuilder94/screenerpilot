import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const PRIORITY = [
  "SPY", "QQQ", "DIA", "IWM", "^VIX",
  "BTCUSDT", "ETHUSDT", "SOLUSDT",
  "GC=F", "CL=F", "DX-Y.NYB", "^TNX",
  "EURUSD=X", "USDJPY=X",
];

export function LiveTickerTape() {
  const { data: rows = [] } = useMarketSnapshots();

  const items = (() => {
    const map = new Map(rows.map((r) => [r.symbol, r]));
    const picked = PRIORITY.map((s) => map.get(s)).filter(Boolean) as typeof rows;
    if (picked.length >= 8) return picked;
    // fallback dummy
    return [
      { symbol: "S&P 500", display_name: "S&P 500", current_price: 5832.4, change_pct_1d: 0.34 },
      { symbol: "NDX", display_name: "Nasdaq", current_price: 20451.2, change_pct_1d: 0.71 },
      { symbol: "BTC", display_name: "Bitcoin", current_price: 98420, change_pct_1d: 1.08 },
      { symbol: "ETH", display_name: "Ethereum", current_price: 3540, change_pct_1d: 1.42 },
      { symbol: "GOLD", display_name: "Gold", current_price: 2715, change_pct_1d: -0.18 },
      { symbol: "WTI", display_name: "WTI Oil", current_price: 71.4, change_pct_1d: 1.42 },
      { symbol: "DXY", display_name: "Dollar", current_price: 106.2, change_pct_1d: 0.08 },
      { symbol: "VIX", display_name: "VIX", current_price: 14.8, change_pct_1d: -1.2 },
      { symbol: "10Y", display_name: "US 10Y", current_price: 4.32, change_pct_1d: -0.05 },
      { symbol: "EURUSD", display_name: "EUR/USD", current_price: 1.046, change_pct_1d: 0.12 },
    ] as any;
  })();

  // Duplicate items for seamless infinite scroll
  const loop = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden border-y border-border bg-card/40 backdrop-blur-sm">
      {/* Edge gradients */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent" />

      <div className="flex animate-ticker whitespace-nowrap py-3">
        {loop.map((r: any, i) => {
          const pct = r.change_pct_1d ?? 0;
          const up = pct >= 0;
          return (
            <div
              key={`${r.symbol}-${i}`}
              className="flex items-center gap-2 px-5 border-r border-border/50 flex-shrink-0"
            >
              <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
                {r.display_name || r.symbol}
              </span>
              <span className="font-mono-tabular text-[13px] text-foreground tabular-nums">
                {typeof r.current_price === "number" ? r.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-mono-tabular text-[12px] tabular-nums",
                  up ? "text-emerald-500" : "text-red-500"
                )}
              >
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? "+" : ""}{pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

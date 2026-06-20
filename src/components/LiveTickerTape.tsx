import { useMarketSnapshots } from "@/hooks/useMarketSnapshots";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const PRIORITY = [
  "SPY", "QQQ", "DIA", "IWM", "^VIX",
  "BTCUSDT", "ETHUSDT", "SOLUSDT",
  "GC=F", "CL=F", "DX-Y.NYB", "^TNX",
  "EURUSD=X", "USDJPY=X",
];

export function LiveTickerTape() {
  const { data: rows = [], isLoading } = useMarketSnapshots();

  const items = (() => {
    const map = new Map(rows.map((r) => [r.symbol, r]));
    return PRIORITY.map((s) => map.get(s)).filter(Boolean) as typeof rows;
  })();

  if (isLoading || items.length < 8) {
    return (
      <div className="relative w-full overflow-hidden border-y border-border bg-card/40 backdrop-blur-sm">
        <div className="flex gap-6 py-3 px-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

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

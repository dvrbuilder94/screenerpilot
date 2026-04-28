import { useMacroIndicators } from "@/hooks/useMacroIndicators";
import { useMarketSnapshotsBySymbols } from "@/hooks/useMarketSnapshots";
import { IndicatorRow } from "./IndicatorRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe2, TrendingUp, TrendingDown } from "lucide-react";
import { BloombergInsight } from "@/components/BloombergInsight";
import { latamFxInsight } from "@/lib/bloombergInsights";

const COUNTRIES = [
  { code: "MX", flag: "🇲🇽", name: "Mexico", fx: "MXN=X" },
  { code: "BR", flag: "🇧🇷", name: "Brazil", fx: "BRL=X" },
  { code: "CL", flag: "🇨🇱", name: "Chile", fx: "CLP=X" },
  { code: "CO", flag: "🇨🇴", name: "Colombia", fx: "COP=X" },
];

export function LatamMacroPanel() {
  const { data: indicators, isLoading } = useMacroIndicators("latam");
  const { data: fxSnapshots } = useMarketSnapshotsBySymbols(COUNTRIES.map((c) => c.fx));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe2 className="h-4 w-4" />
        <span>Latin American Central Banks, Inflation & FX</span>
        <span className="ml-auto text-[11px]">Source: FRED + Yahoo Finance</span>
      </div>

      {/* FX Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COUNTRIES.map((c) => {
          const fx = fxSnapshots?.find((s) => s.symbol === c.fx);
          const chg = fx?.change_pct_1d ?? 0;
          const isUp = chg > 0;
          return (
            <div key={c.code} className="rounded-lg border border-border/40 bg-card/30 p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="text-base">{c.flag}</span>
                  USD/{c.code === "BR" ? "BRL" : c.code === "MX" ? "MXN" : c.code === "CL" ? "CLP" : "COP"}
                </span>
                <span className={isUp ? "text-rose-400" : "text-emerald-400"}>
                  {isUp ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                </span>
              </div>
              <div className="font-mono text-xl font-semibold tabular-nums mt-1">
                {fx?.current_price?.toFixed(c.code === "CL" || c.code === "CO" ? 0 : 2) ?? "—"}
              </div>
              <div className={`text-xs font-mono tabular-nums ${isUp ? "text-rose-400" : "text-emerald-400"}`}>
                {chg > 0 ? "+" : ""}{chg.toFixed(2)}% 1D
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-country tables */}
      {COUNTRIES.map((c) => {
        const countryInds = (indicators ?? []).filter((i) => i.country === c.code);
        if (countryInds.length === 0) return null;
        const fx = fxSnapshots?.find((s) => s.symbol === c.fx);
        const pair = `USD/${c.code === "BR" ? "BRL" : c.code === "MX" ? "MXN" : c.code === "CL" ? "CLP" : "COP"}`;
        return (
          <div key={c.code} className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">{c.flag}</span>
              {c.name}
            </h3>
            <BloombergInsight
              insight={latamFxInsight({ country: c.name, pair, price: fx?.current_price ?? undefined, change1d: fx?.change_pct_1d ?? undefined })}
              panel={`LATAM Macro · ${c.name}`}
              data={{ fx, indicators: countryInds }}
            />
            <div className="rounded-lg border border-border/40 bg-card/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border/40">
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Indicator</th>
                    <th className="text-right py-2 px-3 font-medium">Current</th>
                    <th className="text-right py-2 px-3 font-medium">Previous</th>
                    <th className="text-right py-2 px-3 font-medium">Change</th>
                    <th className="text-left py-2 px-3 font-medium">12M Trend</th>
                    <th className="text-right py-2 px-3 font-medium">As of</th>
                  </tr>
                </thead>
                <tbody>
                  {countryInds.map((ind) => <IndicatorRow key={ind.series_id} indicator={ind} />)}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {(indicators ?? []).length === 0 && (
        <div className="rounded-lg border border-border/40 bg-card/30 p-8 text-center">
          <p className="text-muted-foreground">LATAM macro data loading. Collector runs every 6 hours.</p>
        </div>
      )}
    </div>
  );
}

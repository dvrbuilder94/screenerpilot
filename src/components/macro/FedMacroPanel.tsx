import { useMacroIndicators } from "@/hooks/useMacroIndicators";
import { IndicatorRow } from "./IndicatorRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark } from "lucide-react";
import { BloombergInsight } from "@/components/BloombergInsight";
import type { BloombergInsightData } from "@/components/BloombergInsight";

const FED_ORDER = [
  "DFF", "WALCL", "RRPONTSYD", "M2SL",
  "CPIAUCSL", "CPILFESL", "PCEPI", "PCEPILFE",
  "PAYEMS", "UNRATE", "GDPC1",
];

export function FedMacroPanel() {
  const { data: indicators, isLoading } = useMacroIndicators("fed");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  const sorted = (indicators ?? []).sort((a, b) => {
    const ai = FED_ORDER.indexOf(a.series_id);
    const bi = FED_ORDER.indexOf(b.series_id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/30 p-8 text-center">
        <p className="text-muted-foreground">No macro data available yet. The collector runs every 6 hours.</p>
      </div>
    );
  }

  const dff = sorted.find(i => i.series_id === "DFF");
  const cpi = sorted.find(i => i.series_id === "CPIAUCSL");
  const unr = sorted.find(i => i.series_id === "UNRATE");
  const insight: BloombergInsightData | null = dff || cpi || unr ? {
    signal: `${dff ? `FFR ${dff.current_value?.toFixed(2)}%` : ''}${cpi ? ` · CPI ${cpi.change_pct?.toFixed(2) ?? cpi.current_value}` : ''}${unr ? ` · U-rate ${unr.current_value?.toFixed(1)}%` : ''}`.trim(),
    implication: 'Fed policy stance shapes risk appetite across all asset classes',
    action: 'Watch incoming prints vs consensus for regime shifts',
    tone: (cpi?.change_pct ?? 0) > 3 ? 'caution' : (unr?.change_pct ?? 0) > 0 ? 'bearish' : 'neutral',
  } : null;

  return (
    <div className="space-y-4">
      <BloombergInsight insight={insight} panel="FRED · US Macro Indicators" data={sorted.slice(0, 8)} />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Landmark className="h-4 w-4" />
        <span>Federal Reserve & US Macroeconomic Indicators</span>
        <span className="ml-auto text-[11px]">Source: FRED · St. Louis Fed</span>
      </div>

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
            {sorted.map((ind) => <IndicatorRow key={ind.series_id} indicator={ind} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

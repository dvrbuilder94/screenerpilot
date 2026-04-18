import { MacroIndicator } from "@/hooks/useMacroIndicators";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "@/components/Sparkline";

interface IndicatorRowProps {
  indicator: MacroIndicator;
}

function formatValue(v: number | null, unit: string | null): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  if (unit === "$M" || unit === "$B" || unit === "K jobs") {
    if (abs >= 1_000_000) return (v / 1_000_000).toFixed(2) + "T";
    if (abs >= 1_000) return (v / 1_000).toFixed(2) + (unit === "$M" ? "B" : unit === "K jobs" ? "M" : "T");
    return v.toFixed(0);
  }
  if (unit === "%") return v.toFixed(2) + "%";
  return v.toFixed(2);
}

export function IndicatorRow({ indicator }: IndicatorRowProps) {
  const change = indicator.change_value ?? 0;
  const changePct = indicator.change_pct ?? 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  const history = (indicator.history ?? []).map((h) => h.value);

  return (
    <tr className="border-b border-border/40 hover:bg-card/40 transition-colors">
      <td className="py-3 px-3">
        <div className="font-medium text-sm">{indicator.display_name}</div>
        {indicator.notes && (
          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{indicator.notes}</div>
        )}
      </td>
      <td className="py-3 px-3 text-right font-mono text-base font-semibold tabular-nums">
        {formatValue(indicator.current_value, indicator.unit)}
      </td>
      <td className="py-3 px-3 text-right font-mono text-sm tabular-nums text-muted-foreground">
        {formatValue(indicator.previous_value, indicator.unit)}
      </td>
      <td className="py-3 px-3 text-right">
        <div className={`inline-flex items-center gap-1 font-mono text-sm tabular-nums ${
          isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-muted-foreground"
        }`}>
          {isPositive && <TrendingUp className="h-3 w-3" />}
          {isNegative && <TrendingDown className="h-3 w-3" />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
          {change > 0 ? "+" : ""}{change.toFixed(2)}
          <span className="text-[11px] opacity-70">({changePct > 0 ? "+" : ""}{changePct.toFixed(1)}%)</span>
        </div>
      </td>
      <td className="py-3 px-3 w-24">
        {history.length > 1 ? (
          <Sparkline data={history} width={80} height={24} color={isPositive ? "#10b981" : isNegative ? "#f43f5e" : "#94a3b8"} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-3 text-right text-[11px] text-muted-foreground font-mono">
        {indicator.observation_date ?? "—"}
      </td>
    </tr>
  );
}

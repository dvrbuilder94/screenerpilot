import { RatioSnapshot } from "@/hooks/useRatioSnapshots";
import { Sparkline } from "@/components/Sparkline";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Props {
  ratio: RatioSnapshot;
}

function fmt(v: number | null, digits = 3): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(2);
  return v.toFixed(digits);
}

function fmtPct(v: number | null): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v > 0 ? "+" : "") + v.toFixed(2) + "%";
}

function zBadge(z: number | null) {
  if (z === null || z === undefined || Number.isNaN(z)) {
    return { label: "—", cls: "bg-muted/40 text-muted-foreground" };
  }
  const abs = Math.abs(z);
  if (abs >= 2) {
    return z > 0
      ? { label: "EXTREME HIGH", cls: "bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40", icon: AlertTriangle }
      : { label: "EXTREME LOW", cls: "bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/40", icon: AlertTriangle };
  }
  if (abs >= 1) {
    return z > 0
      ? { label: "RISK-ON", cls: "bg-emerald-500/15 text-emerald-400" }
      : { label: "RISK-OFF", cls: "bg-rose-500/15 text-rose-400" };
  }
  return { label: "NEUTRAL", cls: "bg-muted/40 text-muted-foreground" };
}

export function RatioRow({ ratio }: Props) {
  const badge = zBadge(ratio.z_score);
  const Icon = (badge as any).icon;
  const history = (ratio.history_90d ?? []).map((p) => p.value);
  const change1m = ratio.change_pct_1m ?? 0;

  return (
    <tr className="border-b border-border/40 hover:bg-card/40 transition-colors">
      <td className="py-3 px-3">
        <div className="font-medium text-sm">{ratio.display_name}</div>
        {ratio.notes && (
          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ratio.notes}</div>
        )}
      </td>
      <td className="py-3 px-3 text-right font-mono text-base font-semibold tabular-nums">
        {fmt(ratio.current_value)}
      </td>
      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {fmt(ratio.mean_5y)}
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-mono text-sm tabular-nums font-semibold ${
          (ratio.z_score ?? 0) > 0 ? "text-emerald-400" : (ratio.z_score ?? 0) < 0 ? "text-rose-400" : "text-muted-foreground"
        }`}>
          {ratio.z_score !== null ? (ratio.z_score > 0 ? "+" : "") + ratio.z_score.toFixed(2) : "—"}σ
        </span>
      </td>
      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {ratio.percentile_5y !== null ? ratio.percentile_5y.toFixed(0) + "%" : "—"}
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`inline-flex items-center gap-1 font-mono text-sm tabular-nums ${
          change1m > 0 ? "text-emerald-400" : change1m < 0 ? "text-rose-400" : "text-muted-foreground"
        }`}>
          {change1m > 0 && <TrendingUp className="h-3 w-3" />}
          {change1m < 0 && <TrendingDown className="h-3 w-3" />}
          {fmtPct(ratio.change_pct_1m)}
        </span>
      </td>
      <td className="py-3 px-3 w-24">
        {history.length > 1 ? <Sparkline data={history} width={80} height={24} /> : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
          {Icon && <Icon className="h-2.5 w-2.5" />}
          {badge.label}
        </span>
      </td>
    </tr>
  );
}
